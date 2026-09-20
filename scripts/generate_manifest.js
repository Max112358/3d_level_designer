import fs from "fs";
import path from "path";

const scanCategory = (dir, category) => {
  return fs.readdirSync(dir).map((file) => ({
    id: path.basename(file, path.extname(file)),
    name: path.basename(file, path.extname(file)).replace(/_/g, " "),
    category,
    path: `assets/${category}/${file}`,
  }));
};

const manifest = {
  textures: scanCategory("./public/assets/textures", "textures"),
  props: scanCategory("./public/assets/props", "props"),
  entities: scanCategory("./public/assets/entities", "entities"),
  items: scanCategory("./public/assets/items", "items"),
};

fs.writeFileSync(
  "./public/assets/manifest.json",
  JSON.stringify(manifest, null, 2),
);
