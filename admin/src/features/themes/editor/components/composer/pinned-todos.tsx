import { TodoList } from '../../chat/components/transcript/todo-list';
import type { TodosPart } from '../../chat/model/part';

/** The agent's checklist, kept in view above the message box while it works. */
export function PinnedTodos({ todos }: { todos: TodosPart | undefined }) {
  if (!todos?.items.length) return null;
  return (
    <div className="px-3 pb-2">
      <TodoList part={todos} />
    </div>
  );
}
