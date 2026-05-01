import { Component, inject, output, signal, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgbDateStruct,
  NgbInputDatepicker,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';

export type addDto = {
  title: string;
  dueDate: Date | undefined;
};

@Component({
  selector: 'app-modal',
  imports: [NgbInputDatepicker, FormsModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  onAdd = output<addDto>();

  title = signal<string>('');
  dueDateInput = signal<NgbDateStruct | undefined>(undefined);

  private modalService = inject(NgbModal);

  dateError = signal<boolean>(false);
  titleError = signal<boolean>(false);

  open(content: TemplateRef<any>) {
    this.modalService.open(content).result.finally(() => {
      this.title.set('');
      this.dueDateInput.set(undefined);
      this.dateError.set(false);
      this.titleError.set(false);
    });
  }

  getDate(dueDate: NgbDateStruct) {
    return new Date(dueDate.year, dueDate.month - 1, dueDate.day);
  }

  createTodo(modal: NgbModalRef) {
    this.dateError.set(false);
    this.titleError.set(false);
    if (this.title() === '') {
      this.titleError.set(true);
    }
    if (
      !(
        (typeof this.dueDateInput() === 'object' || this.dueDateInput() === undefined) &&
        this.dueDateInput() !== null
      )
    ) {
      this.dateError.set(true);
    }

    if (!this.dateError() && !this.titleError()) {
      const dueDate =
        this.dueDateInput() !== undefined ? this.getDate(this.dueDateInput()!) : undefined;
      this.onAdd.emit({ title: this.title(), dueDate: dueDate });
      modal.close();
    }

    /*if (
      (typeof this.dueDateInput() === 'object' || this.dueDateInput() === undefined) &&
      this.dueDateInput() !== null &&
      this.title() !== ''
    ) {
      const dueDate =
        this.dueDateInput() !== undefined ? this.getDate(this.dueDateInput()!) : undefined;
      this.onAdd.emit({ title: this.title(), dueDate: dueDate });
      modal.close();
    } else if (this.title() === '') {
      this.titleError.set(true);
    } else if (
      (typeof this.dueDateInput() !== 'object' && this.dueDateInput() !== undefined) ||
      this.dueDateInput() === null
    ) {
      this.titleError.set(true);
    } else {
      this.titleError.set(true);
      this.dateError.set(true);
    }*/
  }
}
