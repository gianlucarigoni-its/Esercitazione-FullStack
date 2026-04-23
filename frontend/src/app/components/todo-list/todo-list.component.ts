import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoService } from './../../services/todo.service';

@Component({
  selector: 'app-todo-list',
  imports: [FormsModule, TodoItemComponent, ModalComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
  todoSrv = inject(TodoService);
  todoList = this.todoSrv.todos;

  showCompleted = false;

  getShowCompleted() {
    this.showCompleted = !this.showCompleted;
    this.todoSrv.fetch(this.showCompleted);
  }

  changeCompleted(id: string, event: boolean) {
    this.todoSrv.updateTodoStatus(id, event);
  }

  addTodo(title: string, dueDate?: Date) {
    this.todoSrv.addTodo(title, dueDate);
  }
}
