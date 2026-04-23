import { DatePipe } from '@angular/common';
import { Component, inject, signal, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbInputDatepicker } from '@ng-bootstrap/ng-bootstrap/datepicker';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap/modal';
import { TodoService } from './../../services/todo.service';

@Component({
  selector: 'app-todo-list',
  imports: [DatePipe, NgbInputDatepicker, FormsModule],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent {
  todoSrv = inject(TodoService);
  todoList = this.todoSrv.todos;

  showCompleted = false;
  title = signal<string>('');
  dueDateInput = signal<NgbDateStruct | null>(null);

  getShowCompleted() {
    this.showCompleted = !this.showCompleted;
    this.todoSrv.fetch(this.showCompleted);
  }

  private modalService = inject(NgbModal);

  open(content: TemplateRef<any>) {
    this.modalService.open(content).result.then(
      (result) => {
        const dueDate = this.dueDateInput() !== null ? this.getDate(this.dueDateInput()!) : undefined;
        this.todoSrv.addTodo(this.title(), dueDate);
      },
      () => {
        // modal dismisso → non fare nulla
      },
    );
  }

  getDate(dueDate: NgbDateStruct) {
    return new Date(dueDate.year, dueDate.month - 1, dueDate.day);
  }
}
