import { ElementalLoadingUi, OptionsItem } from "../../elem";
import { Nv7SingleAPI } from "./nv7single";
import { PackInfo } from "./types";

export function  listUI(api: Nv7SingleAPI): OptionsItem[] {
  let items: OptionsItem[] = [];
  for (let item of api.items) {
    items.push({
      type: "listItem",
      label: item.description,
      title: item.title,
      choices: [
        {
          label: "Like",
          id: "like",
        },
        {
          label: "Install",
          id: "install",
        }
      ],
      onChange: async (id: string) => {
        if (id == "like") {
          await api.ui.loading(async (ui: ElementalLoadingUi) => {
            ui.status("Liking Pack", 0);
            let res = await fetch(api.prefix + "single_like/" + item.id + "/" + item.uid);
            ui.status("Liking Pack", 0.5);
            let text = await res.text();
            if (text != "") {
              ui.status("Showing Error", 0);
              await api.ui.alert({
                "text": text,
                "title": "Error",
              });
            }
          });
          await api.ui.reloadSelf();
        } else if (id == "install") {
          await api.ui.loading(async (ui: ElementalLoadingUi) => {
            ui.status("Downloading Pack", 0);
            let res = await fetch(api.prefix + "single_download/" + item.id + "/" + item.uid);
            ui.status("Downloading Pack", 0.5);
            if (res.status == 500) {
              ui.status("Downloading Error", 0);
              let text = await res.text();
              ui.status("Showing Error", 0);
              await api.ui.alert({
                "text": text,
                "title": "Error",
              });
              return
            }
            let dat = await res.json();
            let info: PackInfo = {
              title: item.title,
              description: item.description,
              id: item.id,
            }
            ui.status("Creating Pack", 0)
            try {
              await api.cache.newPack(info.id);
            } catch (e) {
              await api.cache.init(api);
            }
            ui.status("Processing Pack", 0)
            await new Promise<void>((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, 10);
            });
            let keys = Object.keys(dat);
            let indexes = new Array(keys.length);
            let vals = new Array(keys.length);
            for (let j = 0; j < keys.length; j++) {
              indexes[j] = keys[j]
              vals[j] = dat[keys[j]];
            }
            await api.cache.addAll(info.id, indexes, vals, ui, "Installing Pack");
            ui.status("Setting Up Pack", 0);
            let packs = api.saveFile.get("packs", []) as PackInfo[]
            let isIn = false;
            for (let j = 0; j < packs.length; j++) {
              if (packs[j].id == info.id) {
                isIn = true;
              }
            }
            if (!isIn) {
              packs.push(info);
            }
            ui.status("Setting Up Pack", 0.1);
            api.pack = item.id;
            ui.status("Setting Up Pack", 0.2);
            api.saveFile.set("packs", packs);
            ui.status("Setting Up Pack", 0.4);
            api.saveFile.set("pack", api.pack);
            ui.status("Setting Up Pack", 0.8);
            let found = api.saveFile.get("found", {"default": ["Air", "Earth", "Water", "Fire"]});
            found[api.pack] = ["Air", "Earth", "Fire", "Water"];
            api.saveFile.set("found", found);
            ui.status("Setting Up Pack", 1);
          });
          await api.ui.reloadSelf();
        }
      }
    })
  }
  return items;
}

export async function initListUI(api: Nv7SingleAPI, ui: ElementalLoadingUi): Promise<void> {
  ui.status("Getting Pack List", 0)
  let res = await fetch(api.prefix + "single_list/" + api.saveFile.get("kind", "likes") + "/" + api.saveFile.get("search", ""));
  if (res.status == 500) {
    ui.status("Loading Error", 0);
    let text = await res.text();
    ui.status("Showing Error", 0);
    await api.ui.alert({
      "text": text,
      "title": "Error",
    });
    return
  }
  ui.status("Getting Pack List", 0.5)
  api.items = await res.json();
}
