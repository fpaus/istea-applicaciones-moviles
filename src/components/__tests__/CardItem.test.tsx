import { fireEvent, render } from "@testing-library/react-native";
import { CardItem } from "../CardItem";
import { Task } from "@/src/types";

const task: Task = {
  id: "t1",
  title: "Comprar pan",
  description: "En la panadería",
  notification: null,
  completed: false,
  createdAt: 0,
  parentId: null,
};

const noop = (): void => {};

describe("CardItem onOpen", () => {
  it("invokes onOpen with the task id when the card body is pressed", () => {
    const onOpen = jest.fn();
    const { getByTestId } = render(
      <CardItem item={task} onMarkCompleted={noop} onDelete={noop} onOpen={onOpen} />,
    );

    fireEvent.press(getByTestId("task-card-body-t1"));

    expect(onOpen).toHaveBeenCalledWith("t1");
  });

  it("does not invoke onOpen when the 'Eliminar' button is pressed", () => {
    const onOpen = jest.fn();
    const onDelete = jest.fn();
    const { getByText } = render(
      <CardItem item={task} onMarkCompleted={noop} onDelete={onDelete} onOpen={onOpen} />,
    );

    fireEvent.press(getByText("Eliminar"));

    expect(onDelete).toHaveBeenCalledWith("t1");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not invoke onOpen when the 'Editar' button is pressed", () => {
    const onOpen = jest.fn();
    const onEdit = jest.fn();
    const { getByText } = render(
      <CardItem
        item={task}
        onMarkCompleted={noop}
        onDelete={noop}
        onEdit={onEdit}
        onOpen={onOpen}
      />,
    );

    fireEvent.press(getByText("Editar"));

    expect(onEdit).toHaveBeenCalledWith("t1");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders without a body touch target when onOpen is omitted (backward compatible)", () => {
    const { queryByTestId, getByText } = render(
      <CardItem item={task} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(queryByTestId("task-card-body-t1")).toBeNull();
    // Content still renders.
    expect(getByText("Comprar pan")).toBeTruthy();
  });
});

describe("CardItem image thumbnail", () => {
  it("renders a thumbnail when the task has an imageUri", () => {
    const withImage: Task = { ...task, imageUri: "file:///photo.jpg" };
    const { getByTestId } = render(
      <CardItem item={withImage} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(getByTestId("task-thumbnail-t1")).toBeTruthy();
  });

  it("renders no thumbnail when the task has no image", () => {
    const { queryByTestId } = render(
      <CardItem item={task} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(queryByTestId("task-thumbnail-t1")).toBeNull();
  });
});

describe("CardItem location indicator", () => {
  it("renders a location indicator when the task has a location", () => {
    const withLocation: Task = {
      ...task,
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
        label: "Obelisco",
      },
    };
    const { getByText } = render(
      <CardItem item={withLocation} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(getByText("📍 Obelisco")).toBeTruthy();
  });

  it("renders coordinates if label is not provided", () => {
    const withLocationNoLabel: Task = {
      ...task,
      location: {
        latitude: -34.6037,
        longitude: -58.3816,
      },
    };
    const { getByText } = render(
      <CardItem item={withLocationNoLabel} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(getByText("📍 -34.6037, -58.3816")).toBeTruthy();
  });

  it("renders no location indicator when the task has no location", () => {
    const { queryByText } = render(
      <CardItem item={task} onMarkCompleted={noop} onDelete={noop} />,
    );

    expect(queryByText(/📍/)).toBeNull();
  });
});
