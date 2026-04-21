import { faker } from "@faker-js/faker/locale/it";
import { TodoModel } from "./src/api/todo/todo.module";
import mongoose from "mongoose";

function generateRandomTodo() {
  let dueDate: Date | undefined = undefined;

  if (faker.datatype.boolean({ probability: 0.75 })) {
    dueDate = faker.date.soon({
      days: 150,
      refDate: "2026-04-21T23:59:59.000Z",
    });
  }

  return {
    title: faker.company.catchPhrase(),
    dueDate: dueDate,
    completed: faker.datatype.boolean({ probability: 0.3 }),
  };
}

function generateTodos(num: number) {
  const data = Array.from({ length: num }, () => generateRandomTodo());
  return TodoModel.create(data);
}

const num = 30;
mongoose
  .connect("mongodb://localhost:27017/simulazione_01")
  .then(() => {
    return TodoModel.deleteMany({});
  })
  .then(() => {
    return generateTodos(num);
  })
  .then(() => {
    console.log(`inserted ${num} products`);
    process.exit();
  })
  .catch((err) => {
    console.error(err);
  });
