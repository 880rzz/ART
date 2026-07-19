(function(){
  "use strict";

  const VERSION="2026.07.18-authenticity-1";
  const en=()=>String(window.CERIDWEN_LANG||document.documentElement.lang||"hu").toLowerCase().startsWith("en");
  const t=(hu,enText)=>en()?enText:hu;

  const LAYERS={
    taliesin:{id:"taliesin",hu:"Walesi Taliesin-hagyomány",en:"Welsh Taliesin tradition",kind:"source"},
    mabinogi:{id:"mabinogi",hu:"Mabinogi – középkori walesi próza",en:"Mabinogi – medieval Welsh prose",kind:"source"},
    arthurian:{id:"arthurian",hu:"Középkori arthuri irodalom",en:"Medieval Arthurian literature",kind:"literary"},
    folklore:{id:"folklore",hu:"Brit és walesi folklór",en:"British and Welsh folklore",kind:"folklore"},
    glastonbury:{id:"glastonbury",hu:"Glastonbury története és legendái",en:"Glastonbury history and legend",kind:"place"},
    revival:{id:"revival",hu:"Modern druida újjáélesztés",en:"Modern Druid revival",kind:"modern"},
    avalon:{id:"avalon",hu:"Modern avaloni spiritualitás",en:"Modern Avalonian spirituality",kind:"modern"},
    christian:{id:"christian",hu:"Keresztény és középkori misztikus hagyomány",en:"Christian and medieval mystical tradition",kind:"religious"},
    comparative:{id:"comparative",hu:"Összehasonlító spirituális jelkép",en:"Comparative spiritual symbol",kind:"comparative"},
    original:{id:"original",hu:"A rendszer saját önismereti archetípusa",en:"Original reflective archetype of this system",kind:"original"}
  };

  const EXACT={
    "Ceridwen":"taliesin","Taliesin":"taliesin","Gwion":"taliesin","A Vidra":"taliesin","Az Ökörszem":"taliesin","A Sólyom":"taliesin","A Búzaszem":"taliesin",
    "Rhiannon":"mabinogi","Blodeuwedd":"mabinogi","Arianrhod":"mabinogi","Branwen":"mabinogi",
    "Arthur":"arthurian","Artúr":"arthurian","Merlin":"arthurian","Morgana":"arthurian","Morgan":"arthurian","Viviane":"arthurian","Nimue":"arthurian","Nimueh":"arthurian","Excalibur":"arthurian","A Grál":"arthurian","The Grail":"arthurian",
    "A Vörös Sárkány":"folklore","A Fehér Sárkány":"folklore","The Red Dragon":"folklore","The White Dragon":"folklore",
    "A Tor":"glastonbury","A Vörös Forrás":"glastonbury","A Fehér Forrás":"glastonbury","The Tor":"glastonbury","The Red Spring":"glastonbury","The White Spring":"glastonbury",
    "Mária Magdolna":"christian","Mary Magdalene":"christian","Mihály arkangyal":"christian","Archangel Michael":"christian",
    "Nimród":"comparative","Nimrod":"comparative"
  };

  const HOUSE_LAYER={ust:"taliesin",istennok:"mabinogi",tajak:"avalon",osvenyek:"original",orzok:"arthurian",kristaly:"comparative",hold:"comparative",angyal:"christian"};

  function layerFor(card){
    const id=EXACT[String(card?.nm||"").trim()]||HOUSE_LAYER[card?.h]||"original";
    return LAYERS[id]||LAYERS.original;
  }

  function qualifyDeck(){
    if(typeof DECK==="undefined"||!Array.isArray(DECK))return false;
    for(const card of DECK){
      const layer=layerFor(card);
      card.provenance={layer:layer.id,label:en()?layer.en:layer.hu,kind:layer.kind,interpretation:t("Modern önismereti értelmezés","Modern reflective interpretation")};
    }

    const ceridwen=DECK.find(card=>card.nm==="Ceridwen");
    if(ceridwen){
      ceridwen.u=t(
        "A későn lejegyzett walesi Hanes Taliesin hagyomány nagyasszonya. Üstjében egy évig és egy napig főzi a tudás italát; Gwion a főzet első három cseppjétől nyeri el az ihletet, majd üldözésen és alakváltozásokon át Taliesinként születik újjá. Ebben a rendszerben Ceridwen az érlelő átalakulás archetípusa.",
        "The great woman of the later-recorded Welsh Hanes Taliesin tradition. She brews a potion of knowledge for a year and a day; Gwion receives inspiration from its first three drops and, after a pursuit through transformations, is reborn as Taliesin. In this system, Ceridwen is an archetype of ripening transformation."
      );
    }

    const arianrhod=DECK.find(card=>card.nm==="Arianrhod");
    if(arianrhod){
      arianrhod.u=t(
        "A Mabinogi negyedik ágának alakja, akinek történetében név, fegyver és társ köré szerveződő feltételek és próbatételek jelennek meg. Az ezüst kerék és a csillagvár későbbi költői értelmezések; ebben a rendszerben az idő és a visszatérő minták jelképei.",
        "A figure from the Fourth Branch of the Mabinogi, whose story contains conditions and trials concerning name, arms and marriage. The silver wheel and star castle belong to later poetic interpretation; here they symbolise time and recurring patterns."
      );
    }

    const priestess=DECK.find(card=>/Papnők Tüze|Priestesses' Fire|Priestesses’ Fire/.test(card.nm||""));
    if(priestess){
      priestess.u=t(
        "A kilenc nőből álló avaloni közösség Geoffrey of Monmouth középkori Vita Merlini című művének szigeti gyógyítónőit és a modern avaloni spiritualitás papnő-képét kapcsolja össze. Itt a megosztott szolgálat és a közösségi teherhordás jelképe.",
        "The Avalonian circle of nine women combines the island healers of Geoffrey of Monmouth's medieval Vita Merlini with the priestess imagery of modern Avalonian spirituality. Here it symbolises shared service and communal care."
      );
    }
    return true;
  }

  function renameHouseLabels(){
    const replacements=new Map(en()?[
      ["Goddesses of Avalon","Welsh goddesses and great women"],
      ["Sacred Landscapes of Avalon","Symbolic landscapes of Avalon and Glastonbury"],
      ["Druid Flow","Ceridwen Flow"]
    ]:[
      ["Avalon istennői","Walesi istennők és nagyasszonyok"],
      ["AVALON ISTENNŐI","WALESI ISTENNŐK ÉS NAGYASSZONYOK"],
      ["Avalon szent tájai","Avalon és Glastonbury jelképes tájai"],
      ["AVALON SZENT TÁJAI","AVALON ÉS GLASTONBURY JELKÉPES TÁJAI"],
      ["Druida áramlás","Ceridwen áramlása"]
    ]);
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const trimmed=node.nodeValue.trim();
      if(replacements.has(trimmed))node.nodeValue=node.nodeValue.replace(trimmed,replacements.get(trimmed));
    }
  }

  function simplifyNavigation(){
    const labels=en()?{
      "Entrance":"Start","The Cauldron":"System","Casting":"Card reflection","Cleansing":"Attunement","Pendulum":"Symbolic pendulum","Inner Compass":"Inner compass","Lexicon":"Symbol guide","Journal":"Journal"
    }:{
      "Bejárat":"Kezdés","Az Üst":"Rendszer","Vetés":"Kártyás önreflexió","Tisztítás":"Ráhangolódás","Inga":"Jelképes inga","Belső Iránytű":"Belső iránytű","Lexikon":"Jelképtár","Napló":"Napló"
    };
    document.querySelectorAll("nav.tabs button,nav.tabs a").forEach(el=>{const key=el.textContent.trim();if(labels[key])el.textContent=labels[key];});
  }

  function sourceGuide(){
    if(document.getElementById("mythologySourceGuide"))return;
    const anchor=document.querySelector(".awen-meaning")||document.querySelector(".gate-lede");
    if(!anchor)return;
    const section=document.createElement("section");
    section.id="mythologySourceGuide";
    section.className="mythology-guide";
    section.innerHTML=en()?`
      <h2>Choose a clear path</h2>
      <p class="mythology-guide__lead">This is a source-aware reflective system, not a reconstruction of one ancient Celtic religion. Historical material and modern interpretation are marked separately.</p>
      <div class="mythology-paths">
        <button type="button" data-open-tab="draw"><strong>Card reflection</strong><span>Use a symbolic story to examine one question.</span></button>
        <a href="yes-no-en.html"><strong>Yes / No pause</strong><span>Slow down before a binary decision.</span></a>
        <button type="button" data-open-tab="cleanse"><strong>Attunement</strong><span>Settle attention before asking.</span></button>
      </div>
      <details><summary>Tradition, sources and interpretation</summary><div>
        <p><strong>Welsh source layer:</strong> the Mabinogi and the later-recorded Hanes Taliesin tradition.</p>
        <p><strong>Arthurian layer:</strong> medieval literary traditions that developed over centuries.</p>
        <p><strong>Avalon and Glastonbury:</strong> historical places, medieval legends and modern spiritual interpretation are not treated as the same kind of evidence.</p>
        <p><strong>Awen:</strong> an old Welsh word for poetic inspiration; the familiar three-ray emblem belongs to the modern Druid revival.</p>
        <p><strong>Reflective layer:</strong> light, shadow and affirmation texts are original modern interpretations, not translations of ancient teachings.</p>
        <p class="mythology-links"><a href="https://www.library.wales/discover-learn/digital-exhibitions/manuscripts/the-middle-ages/book-of-taliesin" target="_blank" rel="noopener">National Library of Wales: Book of Taliesin</a> · <a href="https://www.glastonburyabbey.com/myths-and-legends.php" target="_blank" rel="noopener">Glastonbury Abbey: myths and legends</a></p>
      </div></details>`:`
      <h2>Válassz egyértelmű utat</h2>
      <p class="mythology-guide__lead">Ez forrásérzékeny önismereti rendszer, nem egyetlen ősi kelta vallás rekonstrukciója. A történeti anyagot és a modern értelmezést külön jelöljük.</p>
      <div class="mythology-paths">
        <button type="button" data-open-tab="draw"><strong>Kártyás önreflexió</strong><span>Egy jelképes történeten keresztül nézz rá a kérdésedre.</span></button>
        <a href="yes-no.html"><strong>Igen / Nem megállás</strong><span>Lassíts le egy kétirányú döntés előtt.</span></a>
        <button type="button" data-open-tab="cleanse"><strong>Ráhangolódás</strong><span>Csendesítsd le a figyelmedet a kérdés előtt.</span></button>
      </div>
      <details><summary>Hagyomány, forrás és értelmezés</summary><div>
        <p><strong>Walesi forrásréteg:</strong> a Mabinogi és a későn lejegyzett Hanes Taliesin hagyománya.</p>
        <p><strong>Arthuri réteg:</strong> évszázadokon át formálódó középkori irodalmi hagyomány.</p>
        <p><strong>Avalon és Glastonbury:</strong> a történeti helyszínt, a középkori legendát és a modern spiritualitást nem azonos bizonyító erejű forrásként kezeljük.</p>
        <p><strong>Awen:</strong> régi walesi szó a költői ihletre; a ma ismert háromsugaras embléma a modern druida újjáélesztéshez tartozik.</p>
        <p><strong>Önismereti réteg:</strong> a fény-, árnyék- és megerősítő szövegek mai, saját értelmezések, nem ősi tanítások fordításai.</p>
        <p class="mythology-links"><a href="https://www.library.wales/discover-learn/digital-exhibitions/manuscripts/the-middle-ages/book-of-taliesin" target="_blank" rel="noopener">Walesi Nemzeti Könyvtár: Taliesin könyve</a> · <a href="https://www.glastonburyabbey.com/myths-and-legends.php" target="_blank" rel="noopener">Glastonbury Abbey: mítoszok és legendák</a></p>
      </div></details>`;
    anchor.insertAdjacentElement("afterend",section);
    section.querySelectorAll("[data-open-tab]").forEach(button=>button.addEventListener("click",()=>document.querySelector(`[data-v="${button.dataset.openTab}"]`)?.click()));
  }

  function clarifyOpening(){
    const lede=document.querySelector(".gate-lede");
    if(lede)lede.textContent=t(
      "Az üst nem jósol: jelképes történetekkel segít megfogalmazni, mi érlelődik benned. Válassz egy utat, tegyél fel egy tiszta kérdést, majd a végén rögzíts egy megvalósítható lépést.",
      "The cauldron does not predict: it uses symbolic stories to help you name what is ripening within you. Choose one path, ask a clear question, and finish by recording one practical step."
    );
    const awen=document.querySelector(".awen-meaning");
    if(awen)awen.innerHTML=t(
      "<strong>Az awen</strong> régi walesi szó a költői ihletre és sugallatra. A háromsugaras jel modern druida embléma; itt a figyelem, az értelem és a cselekvés összehangolását jelképezi.",
      "<strong>Awen</strong> is an old Welsh word for poetic inspiration. The three-ray sign is a modern Druid emblem; here it represents the alignment of attention, understanding and action."
    );
  }

  function provenanceBadge(card){
    const layer=layerFor(card);
    const badge=document.createElement("div");
    badge.className=`mythology-provenance mythology-provenance--${layer.kind}`;
    badge.innerHTML=`<span>${en()?layer.en:layer.hu}</span><small>${t("Mai önismereti értelmezés","Modern reflective interpretation")}</small>`;
    return badge;
  }

  function decorateRenderedCards(root=document){
    if(typeof DECK==="undefined"||!Array.isArray(DECK))return;
    const candidates=root.querySelectorAll?.(".card,.lexcard,.lex-card,.reading-card,.result-card,.drawn-card,.card-detail")||[];
    for(const element of candidates){
      if(element.dataset.mythologyProvenance)return;
      const text=element.textContent||"";
      const card=DECK.find(item=>item?.nm&&text.includes(item.nm));
      if(!card)continue;
      element.dataset.mythologyProvenance=card.provenance?.layer||layerFor(card).id;
      const target=element.querySelector("h2,h3,.card-title,.name")||element.firstElementChild||element;
      target.insertAdjacentElement("afterend",provenanceBadge(card));
    }
  }

  function installRandomModeLanguage(){
    if(typeof randomModeDesc!=="function")return;
    randomModeDesc=function(){
      return randomMode==="ritual"
        ? t("Ceridwen áramlása: kriptográfiai véletlenből húz, és csak a túl közeli ismétlések esélyét csökkenti. Ez modern felhasználói működés, nem történeti druida eljárás.","Ceridwen Flow: uses cryptographic randomness and only reduces the chance of very recent repetition. This is a modern interaction design, not a historical Druid practice.")
        : t("Tiszta sorsolás: emlékezet nélküli kriptográfiai húzás, minden elérhető lap azonos alap-eséllyel.","Pure draw: memoryless cryptographic selection in which every available card has the same base chance.");
    };
    if(typeof renderRandomModes==="function")renderRandomModes();
  }

  function run(){
    const deckQualified=qualifyDeck();
    clarifyOpening();
    simplifyNavigation();
    renameHouseLabels();
    sourceGuide();
    installRandomModeLanguage();
    decorateRenderedCards();
    const observer=new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)decorateRenderedCards(node);
      renameHouseLabels();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.CeridwenMythologyAudit={version:VERSION,installed:true,deckQualified,layerCount:Object.keys(LAYERS).length,sourceAware:true,historicalClaimsQualified:true,navigationModel:"three-primary-paths",layers:LAYERS};
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",run,{once:true});else run();
})();
