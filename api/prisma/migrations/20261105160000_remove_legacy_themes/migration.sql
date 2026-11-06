-- Remove legacy JSON-based themes. Code-based storefront models are unaffected.
DROP TABLE "theme_versions";
DROP TABLE "theme_components";
DROP TABLE "theme_pages";
DROP TABLE "themes";
DROP TYPE "ThemeComponentKind";
DROP TYPE "ThemeResource";
DROP TYPE "ThemeStatus";
