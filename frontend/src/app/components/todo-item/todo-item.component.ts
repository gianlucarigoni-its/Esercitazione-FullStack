import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Todo } from '../../entities/todo.entity';

@Component({
  selector: 'app-todo-item',
  imports: [DatePipe],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.css',
})
export class TodoItemComponent {
  todo = input.required<Todo>();

  onChange = output<boolean>();

  changeCompleted() {
    this.onChange.emit(!this.todo().completed);
  }
}
