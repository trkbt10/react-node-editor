/**
 * @file Minimal Storybook type declarations used solely for local type-checking.
 */
declare module "@storybook/react" {
  type StoryDecorator = (Story: React.ComponentType) => React.ReactElement;

  export type Meta<TComponent> = {
    title: string;
    component: TComponent;
    parameters?: Record<string, unknown>;
    decorators?: StoryDecorator[];
  };

  export type StoryObj = {
    args?: Record<string, unknown>;
  } & Record<string, unknown>;
}
