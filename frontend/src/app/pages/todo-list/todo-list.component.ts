import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../../components/modal/modal.component';
import { TodoItemComponent } from '../../components/todo-item/todo-item.component';
import { TodoService } from '../../services/todo.service';

export interface Toast {
  template: TemplateRef<any>;
  classname?: string;
  delay?: number;
}

@Component({
  selector: 'app-todo-list',
  imports: [FormsModule, TodoItemComponent, ModalComponent, NgbToast, NgTemplateOutlet],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
  todoSrv = inject(TodoService);
  todoList = this.todoSrv.todos;
  //todoList = signal<Todo[]>([]);   //<-- solo per test

  @ViewChild('successTpl') successTpl!: TemplateRef<any>;
  @ViewChild('dangerTpl') dangerTpl!: TemplateRef<any>;

  toasts = signal<Toast[]>([]);

  showCompleted = signal<boolean>(false);

  getShowCompleted() {
    this.showCompleted.set(!this.showCompleted());
    this.todoSrv.fetch(this.showCompleted());
  }

  changeStatus(id: string, event: boolean) {
    this.todoSrv.updateTodoStatus(id, event, this.showCompleted());
  }

  async addTodo(title: string, dueDate?: Date) {
    try {
      await this.todoSrv.addTodo(title, dueDate);
      this.showSuccessToast(this.successTpl);
    } catch (err) {
      this.showDangerToast(this.dangerTpl);
    }
  }

  showSuccessToast(template: TemplateRef<any>) {
    const toast = { template, classname: 'bg-success text-light', delay: 5000 };
    this.toasts.update(toasts => [...toasts, toast]);
  }

  showDangerToast(template: TemplateRef<any>) {
    const toast = { template, classname: 'bg-danger text-light', delay: 5000 };
    this.toasts.update(toasts => [...toasts, toast]);
  }

  remove(toast: Toast) {
    this.toasts.update(toasts => toasts.filter(t => t !== toast));
  }
}
