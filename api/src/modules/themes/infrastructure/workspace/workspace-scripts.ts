import {
  PROJECT_ROOT,
  RUNTIME_ROOT,
} from "@/integrations/sandbox/sandbox.constants";
import {
  MAX_EXTRACTED_SNAPSHOT_BYTES,
  MAX_SNAPSHOT_ENTRIES,
  MAX_SOURCE_FILES,
  MAX_SOURCE_FILE_BYTES,
} from "../../domain/workspace.policy";

// Scripts run inside the isolated sandbox. All paths and limits come from the owning module.
export const FILES_SCRIPT = `
import pathlib,json,sys,os,stat
root=pathlib.Path(${JSON.stringify(PROJECT_ROOT)})
blocked={'.git','node_modules','.next','.opencode','.cloviana','dist','.turbo'}
def allowed(p):
  return not any(x in blocked or x.startswith(('.env','._')) for x in p.parts) and not p.is_absolute() and '..' not in p.parts
if len(sys.argv)>1:
  rel=pathlib.PurePosixPath(sys.argv[1])
  if not allowed(rel): raise ValueError('Invalid file path')
  # Resolve each directory relative to an open descriptor without following links.
  directory=os.open(root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
  try:
    for part in rel.parts[:-1]:
      next_directory=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=directory)
      os.close(directory)
      directory=next_directory
    with os.fdopen(os.open(rel.parts[-1],os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=directory),'rb') as source:
      if not stat.S_ISREG(os.fstat(source.fileno()).st_mode): raise ValueError('Invalid file')
      data=source.read(${MAX_SOURCE_FILE_BYTES}+1)
      if len(data)>${MAX_SOURCE_FILE_BYTES}: raise ValueError('File exceeds 1 MiB')
      content=data.decode('utf-8')
  finally:
    os.close(directory)
  if '\\x00' in content: raise ValueError('Binary file')
  print(json.dumps({'path':str(rel),'content':content}))
else:
  files=[]
  directory=os.open(root,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)
  try:
    for base,dirs,names,parent in os.fwalk('.',dir_fd=directory,follow_symlinks=False):
      dirs[:]=[d for d in dirs if d not in blocked and not d.startswith('.env') and stat.S_ISDIR(os.stat(d,dir_fd=parent,follow_symlinks=False).st_mode)]
      for n in sorted(names):
        path=pathlib.PurePosixPath(base)/n
        info=os.stat(n,dir_fd=parent,follow_symlinks=False)
        if not stat.S_ISREG(info.st_mode) or not allowed(path): continue
        files.append({'path':str(path),'size':info.st_size})
        if len(files)>${MAX_SOURCE_FILES}: raise ValueError('Too many files')
  finally:
    os.close(directory)
  print(json.dumps(sorted(files,key=lambda f:f['path'])))
`;

export const RESTORE_SCRIPT = `
import tarfile,pathlib,shutil
root=pathlib.Path(${JSON.stringify(PROJECT_ROOT)})
root.mkdir(parents=True,exist_ok=True)
# The image bakes these in, and a restore always runs in a sandbox created from that image.
for child in root.iterdir():
  if child.name in ('node_modules','.next'): continue
  if child.is_dir() and not child.is_symlink(): shutil.rmtree(child)
  else: child.unlink()
with tarfile.open(${JSON.stringify(`${RUNTIME_ROOT}/restore.tar.gz`)},'r:gz') as t:
  entries=t.getmembers()
  if len(entries)>${MAX_SNAPSHOT_ENTRIES} or sum(m.size for m in entries)>${MAX_EXTRACTED_SNAPSHOT_BYTES}: raise ValueError('Archive too large')
  for m in entries:
    p=pathlib.PurePosixPath(m.name)
    if p.is_absolute() or '..' in p.parts or not (m.isfile() or m.isdir()): raise ValueError('Unsafe archive entry')
  for m in entries:
    path=root/pathlib.PurePosixPath(m.name)
    if m.isdir(): path.mkdir(parents=True,exist_ok=True)
    else:
      path.parent.mkdir(parents=True,exist_ok=True)
      with t.extractfile(m) as source, path.open('wb') as destination: shutil.copyfileobj(source,destination)
      path.chmod(m.mode & 0o777)
# The archive carries the agent's .git, and a replace ref would change what the reset writes.
shutil.rmtree(root/'.git'/'refs'/'replace',ignore_errors=True)
`;

export const REVERT_RESULT = {
  ok: "OK",
  missingCommit: "MISSING_COMMIT",
  dependenciesChanged: "DEPENDENCIES_CHANGED",
} as const;

// Moves a healthy sandbox to another revision without reinstalling. Any answer but OK, or any error,
// sends the caller to a clean rebuild. The agent could write to .git, so nothing in it is trusted:
// config, hooks, attributes and replace refs are all able to run code or change the bytes written.
export const REVERT_SCRIPT = `
import os,pathlib,shutil,signal,subprocess,sys
root=pathlib.Path(${JSON.stringify(PROJECT_ROOT)})
runtime=${JSON.stringify(RUNTIME_ROOT)}
target=sys.argv[1]
keep={os.getpid(),os.getppid(),1}
for entry in pathlib.Path('/proc').iterdir():
  if not entry.name.isdigit() or int(entry.name) in keep: continue
  try:
    cwd=os.readlink(entry/'cwd')
    if cwd.startswith(str(root)) or cwd.startswith(runtime): os.kill(int(entry.name),signal.SIGKILL)
  except (OSError,ProcessLookupError): pass
git=root/'.git'
if git.is_symlink() or not git.is_dir(): raise ValueError('Invalid repository')
for name in ('config','info/attributes','info/exclude','objects/info/alternates','shallow'):
  path=git/name
  if path.is_dir() and not path.is_symlink(): shutil.rmtree(path)
  elif path.exists() or path.is_symlink(): path.unlink()
for name in ('hooks','refs/replace'): shutil.rmtree(git/name,ignore_errors=True)
(git/'config').write_text('[core]\\n\\trepositoryformatversion = 0\\n\\tfilemode = true\\n\\tbare = false\\n\\thooksPath = /dev/null\\n[user]\\n\\tname = Cloviana\\n\\temail = agent@cloviana.invalid\\n')
(git/'info').mkdir(exist_ok=True)
(git/'info'/'exclude').write_text('.env*\\nnode_modules/\\n.next/\\n.opencode/\\n.cloviana/\\ndist/\\n.turbo/\\n')
env={**os.environ,'GIT_NO_REPLACE_OBJECTS':'1','GIT_CONFIG_GLOBAL':'/dev/null','GIT_CONFIG_NOSYSTEM':'1','GIT_ATTR_NOSYSTEM':'1'}
def run(*args,check=True):
  return subprocess.run(['git',*args],cwd=root,env=env,check=check,capture_output=True)
if run('cat-file','-e',target+'^{commit}',check=False).returncode!=0:
  print('${REVERT_RESULT.missingCommit}')
  sys.exit(0)
lock=root/'package-lock.json'
wanted=run('show',target+':package-lock.json',check=False)
if wanted.returncode!=0 or not lock.is_file() or lock.is_symlink() or lock.read_bytes()!=wanted.stdout:
  print('${REVERT_RESULT.dependenciesChanged}')
  sys.exit(0)
run('reset','--hard',target)
run('clean','-ffdx','-e','node_modules','-e','.next')
if run('rev-parse','HEAD').stdout.decode().strip()!=target or run('status','--porcelain').stdout.strip():
  raise ValueError('Revert did not reach the target')
(root/'.next'/'dev'/'lock').unlink(missing_ok=True)
print('${REVERT_RESULT.ok}')
`;

export const PREPARE_GIT_SCRIPT = `
import pathlib,subprocess
root=pathlib.Path(${JSON.stringify(PROJECT_ROOT)})
blocked={'node_modules','.next','.opencode','.cloviana','dist','.turbo'}
exclude=root/'.git/info/exclude'
exclude.parent.mkdir(parents=True,exist_ok=True)
with exclude.open('a') as f: f.write('\\n.env*\\n'+''.join(x+'/\\n' for x in blocked))
tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\\x00')
remove=[p for p in tracked if p and any(x in blocked or x.startswith('.env') for x in pathlib.PurePosixPath(p).parts)]
for offset in range(0,len(remove),500): subprocess.run(['git','rm','--cached','--ignore-unmatch','--',*remove[offset:offset+500]],cwd=root,check=True,stdout=subprocess.DEVNULL)
`;

export const CREATE_SNAPSHOT_SCRIPT = `
import pathlib,subprocess,tarfile
root=pathlib.Path(${JSON.stringify(PROJECT_ROOT)})
blocked={'node_modules','.next','.opencode','.cloviana','dist','.turbo'}
entry_count=0
total_bytes=0
def filter(m):
  global entry_count,total_bytes
  p=pathlib.PurePosixPath(m.name)
  if any(x in blocked or x.startswith('.env') for x in p.parts): return None
  if str(p) in ('.git/config','.git/hooks') or str(p).startswith('.git/hooks/'): return None
  if not (m.isfile() or m.isdir()): return None
  entry_count+=1
  total_bytes+=m.size
  if entry_count>${MAX_SNAPSHOT_ENTRIES} or total_bytes>${MAX_EXTRACTED_SNAPSHOT_BYTES}: raise ValueError('Archive too large')
  m.uid=m.gid=0; m.uname=m.gname=''
  return m
with tarfile.open(${JSON.stringify(`${RUNTIME_ROOT}/snapshot.tar.gz`)},'w:gz') as t:
  t.add(root/'.git',arcname='.git',filter=filter)
  tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\\x00')
  for name in tracked:
    if not name: continue
    path=root/name
    if path.is_file() and not path.is_symlink(): t.add(path,arcname=name,filter=filter)
`;
