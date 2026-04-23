import { Component, inject, output, signal, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDateStruct, NgbInputDatepicker, NgbModal } from '@ng-bootstrap/ng-bootstrap';

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

  open(content: TemplateRef<any>) {
    this.modalService
      .open(content)
      .result.then(
        (result) => {
          const dueDate = this.dueDateInput() !== undefined ? this.getDate(this.dueDateInput()!) : undefined;
          this.onAdd.emit({ title: this.title(), dueDate: dueDate });
        },
        () => {},
      )
      .finally(() => {
        this.title.set('');
        this.dueDateInput.set(undefined);
      });
  }

  getDate(dueDate: NgbDateStruct) {
    return new Date(dueDate.year, dueDate.month - 1, dueDate.day);
  }
}
