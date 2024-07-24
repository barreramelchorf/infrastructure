export interface Metadata {
  labels: {
    [key: string]: string;
  };
  env: {
    [key: string]: string;
  };
  secret: {
    [key: string]: string;
  };
}
