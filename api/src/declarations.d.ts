declare module "*.hbs" {
  const content: string;
  export default content;
  // If you specifically want named imports like { researchTemplate }
  export const researchTemplate: string;
}
