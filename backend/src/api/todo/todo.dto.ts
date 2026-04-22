import { Type } from 'class-transformer';
import { IsBooleanString, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ShowCompletedDto {
  @IsBooleanString()
  @IsOptional()
  showCompleted?: string;
}

export class AddTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;
}
