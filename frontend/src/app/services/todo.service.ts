import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import type { Todo } from './../entities/todo.entity';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private http = inject(HttpClient);

  private internal = signal<Todo[]>([]);
  todos = this.internal.asReadonly();

  constructor() {
    this.fetch();
  }

  fetch(showCompleted?: boolean) {
    if (showCompleted) {
      this.http.get<Todo[]>('api/todos?showCompleted=true').subscribe((items) => {
        this.internal.set(items);
      });
    } else {
      this.http.get<Todo[]>('api/todos').subscribe((items) => {
        this.internal.set(items);
      });
    }
  }

  addTodo(title: string, dueDate: Date | undefined): void {
    this.http
      .post<Todo>(`/api/todos`, {
        title: title,
        dueDate: dueDate,
      })
      .subscribe((newItem) => {
        this.internal.set([...this.internal(), newItem]);
      });
  }

  updateTodoStatus(id: string, completed: boolean, showCompleted: boolean) {
    if (completed) {
      this.http.patch<Todo>(`/api/todos/${id}/check`, null).subscribe((updated) => {
        const index = this.internal().findIndex((todo) => todo.id === id);

        if (index === -1) {
          throw new Error(`Missing item with id ${id}`);
        }

        const clone = structuredClone(this.internal());
        clone[index] = updated;
        this.internal.set(clone);

        this.fetch(showCompleted);
      });
    } else {
      this.http.patch<Todo>(`/api/todos/${id}/uncheck`, null).subscribe((updated) => {
        const index = this.internal().findIndex((todo) => todo.id === id);

        if (index === -1) {
          throw new Error(`Missing item with id ${id}`);
        }

        const clone = structuredClone(this.internal());
        clone[index] = updated;
        this.internal.set(clone);

        this.fetch(showCompleted);
      });
    }
  }
}
