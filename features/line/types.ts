export type LineTemplateConfig = {
  headerColor: string;
  headerText: string;
};

export type LineTemplate = {
  key: string;
  label: string;
  is_active: boolean;
  config: LineTemplateConfig;
};
