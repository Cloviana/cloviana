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
shutil.rmtree(root,ignore_errors=True)
root.mkdir(parents=True)
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
