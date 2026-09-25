const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const DATA_FILE = path.join(DATA_DIR, "parties.json");
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const TRAIL_ADMIN_PASSWORD = String(process.env.TRAIL_ADMIN_PASSWORD || "");
const TRAIL_ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;
const MIME_TYPES = { ".css":"text/css; charset=utf-8", ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".webmanifest":"application/manifest+json; charset=utf-8", ".png":"image/png", ".svg":"image/svg+xml", ".webp":"image/webp" };
const PUBLIC_FILES = new Set(["/", "/index.html", "/app.js", "/styles.css", "/overrides.css", "/manifest.webmanifest", "/service-worker.js", "/app-icon.svg", "/rimuru-slime.png"]);

function readDatabase(){ try{const raw=JSON.parse(fs.readFileSync(DATA_FILE,"utf8"));return {parties:raw?.parties&&typeof raw.parties==="object"?raw.parties:{},trails:raw?.trails&&typeof raw.trails==="object"?raw.trails:{},trailAdminSessions:raw?.trailAdminSessions&&typeof raw.trailAdminSessions==="object"?raw.trailAdminSessions:{}};}catch{return {parties:{},trails:{},trailAdminSessions:{}};} }
let database = readDatabase();
function saveDatabase(){ fs.mkdirSync(DATA_DIR,{recursive:true});fs.writeFileSync(DATA_FILE,JSON.stringify(database,null,2)); }
function id(prefix){ return `${prefix}_${crypto.randomBytes(18).toString("hex")}`; }
function now(){ return new Date().toISOString(); }
function zeroEnergyTrail(){ return {id:"builtin_zero_energy",name:"Corpo Sem Energia",summary:"Sem conexão com Energia: use Stamina, sustentada pela Destreza, e capacidades físicas superiores.",details:"Características: três Características Principais; +35% dano sobrenatural recebido. Stamina substitui Energia e não pode ser recuperada fora de descanso completo do Mestre. Abaixo de 50%: −12% dano; em 25% ou menos: −27% dano; em 0 ou menos: colapso e 4 PV por ponto negativo. Repouso recupera 12 Stamina. Caçador de Feiticeiros: +1 em testes e +10% dano contra magos identificados. Corpinho Flexível: +1 em testes de Destreza. Treinado para a Guerra: +25 PV e +7% dano físico. Músculos de Ferro: −5% dano físico recebido. Burrinho: −1 em testes de Inteligência. Cético: −3 em Estudos Esotéricos. Paranóico: +15% dano de Sanidade. Corpo Sem Energia: DT +5 para ser detectado por Energia.",codeSalt:"9f4c7ab2d5e80c61c34e2198a46d7f05",codeHash:"83e4da48a9a77b6462158ca9b3b0068cc3d4ba6d1d8c7dcffa1a7dd1abbf66197fc60d1dc081416af041a18a473280075f7631f8bda16d51d0c6bb98cf392414",mechanics:{type:"zero_energy",hpBonus:25,physicalDamageBonus:.07,physicalDamageReduction:.05,supernaturalDamageVulnerability:.35,staminaAttribute:"Destreza",staminaLowThreshold:.5,staminaLowPenalty:.12,staminaCriticalThreshold:.25,staminaCriticalPenalty:.27,staminaRest:12,negativeStaminaDamage:4,mageDamageBonus:.1,mageTestBonus:1,dexterityTestBonus:1,intelligenceTestPenalty:-1,esotericTestPenalty:-3,sanityDamageVulnerability:.15,energyDetectionDifficulty:5,principalAttributes:3},createdAt:"2026-08-27T00:00:00.000Z",updatedAt:"2026-08-27T00:00:00.000Z"}; }
function enchanterTrail(){ return {id:"builtin_enchanter",name:"Encantador",summary:"Persuasão através da Sedução, afetando criaturas conscientes capazes de desenvolver interesse ou apego, mesmo sem fala.",details:"Principais\n• Leitura do Desejo (−3): após interagir com alguém Encantado por você, descubra uma motivação atual dele (dinheiro, segurança, poder, afeto, aprovação etc.). Explorar isso coerentemente concede DT −2 em Persuasão.\n• Tentação Irrecusável (−4): contra um Encantado, faça Sedução para conseguir algo que normalmente recusaria, como informação, favor, acesso ou assumir um risco moderado. Se estiver Fascinado, você pode mantê-lo recebendo +1 Fixação. Não supera princípios fundamentais ou autopreservação.\n\nSecundárias\n• Química Natural (−2): DT −2 no primeiro teste de Sedução contra cada criatura por cena.\n• Beleza Impecável (−1): sua beleza de outro mundo torna ações envolvendo Persuasão mais suaves. DT −1 em ações envolvendo o status de Persuasão.\n\nFraquezas\n• Rosto Marcante (+3): sua aparência é difícil de esquecer. Quem observar ou interagir com você tem facilidade para reconhecê-lo ou descrevê-lo depois; você recebe DT +4 para evitar reconhecimento ou convencer alguém que já o viu de que não era você.\n• Imagem é Tudo (+4): se estiver ensanguentado, imundo, desfigurado ou com a aparência severamente comprometida, recebe DT +2 em Sedução e perde os bônus das Secundárias até conseguir se recompor.\n• Estrela Quebrada (+4): se não conseguir tirar proveito completo de Presença por algum fator externo — como acorrentamento, distância, estar amordaçado ou com o rosto coberto — recebe DT +4 em todos os testes de Persuasão, Sedução e Atuação, e não pode utilizar suas características Secundárias.",codeSalt:"7f60800375a459985f915da822795137",codeHash:"97678994949be39ab7d5700eec24ffdcc5c8a951d21d0a5f2e083f1018a87b93051b5095c1c4f63659cb2c4b2a21e31c8862db65ead51633dd5c91cc584268c7",mechanics:{type:"enchanter",primaryAttribute:"Presença",persuasionThroughSeduction:true,affectsConsciousCreaturesWithoutSpeech:true,desireReadingDifficultyModifier:-3,desireExploitationPersuasionDifficultyModifier:-2,irresistibleTemptationDifficultyModifier:-4,fascinatedFixationGain:1,naturalChemistryFirstSeductionDifficultyModifier:-2,flawlessBeautyPersuasionDifficultyModifier:-1,markedFaceCost:3,avoidRecognitionDifficultyModifier:4,imageIsEverythingCost:4,compromisedAppearanceSeductionDifficultyModifier:2,brokenStarCost:4,restrictedPresenceSocialDifficultyModifier:4},createdAt:"2026-08-28T00:00:00.000Z",updatedAt:"2026-08-28T00:00:00.000Z"}; }
function friendlySlimeTrail(){ return {id:"builtin_friendly_slime",name:"Eu Não Sou um Slime Malvado",summary:"Um humano renascido como slime que aprendeu a falar e precisa sobreviver como membro da raça considerada mais fraca do planeta.",details:"Descrição\nVocê era um humano na Terra que renasceu como um slime. Apesar do novo corpo, encontrou uma forma de falar e pronuncia a língua humana fluentemente.\n\nCaracterísticas Principais\n• Hack do Minato: a trilha inicia com três Características Principais em vez de duas. Em troca, o slime não pode usar escudos, pois não tem força para segurá-los.\n• Predador (−6): pode devorar um ser vivo morto há pouco tempo. Após passar em Estudos Esotéricos, sintetiza suas Habilidades ou Truques Simples e escolhe um para adquirir. O limite de habilidades sintetizadas é 50% da Inteligência, arredondado para cima; ao atingir o limite, deve substituir uma habilidade. Seu estômago substitui o inventário: pode engolir objetos, usar o efeito especial de itens engolidos ou, após passar em Criação, transformá-los nos materiais originais e vomitá-los. Objetos engolidos não voltam à forma anterior. Capacidade: 6 + 1d3 + Inteligência.\n• Corpo Mole (−2): por não possuir ossos, pode atravessar espaços estreitos, como pequenas frestas de portas ou fechaduras.\n• Humano, Mas Mole (−2): pode assumir a forma de alguém que já tenha devorado. Ao trocar de forma, nunca mais poderá retornar à forma anterior.\n\nCaracterísticas Secundárias\n• Assexuado (−4): não sente atração, interesse ou fascínio romântico ou sexual.\n• Abençoado (−5): condições positivas ou bênçãos causadas por você têm cura aumentada em 25% e duração aumentada em 40%, arredondadas para cima.\n• Conjurador (−3): magias têm o alcance aumentado em 3 metros.\n\nFraquezas\n• Inferno Me Faz Derreter (+6): recebe três vezes o dano de magias de fogo.\n• Muito Edgy Pra Mim (+6): recebe três vezes o dano de magias de escuridão.\n• Feito de Papel (+3): o dano físico causado pelo slime é reduzido em 40%.\n• Betinha (+2): recebe −2 em qualquer teste de Presença, pois sua raça é desprezada por ser considerada fraca.\n• Seu Corpo Não São Suas Regras (+5): não pode usar armaduras, pois elas não se sustentam em seu corpo, mesmo ao assumir outra forma com Predador.",codeSalt:"d57be5127aa633d4a1c722f31117db72",codeHash:"b22bbfcdd247e63b2d90e0e5e039accfbd6b667bb613840a0111e47adb2c002aa1d7347a0cc39323c26bd939274c6ab7ea90e857b21c62ef153d0a6ded5fb28c",mechanics:{type:"friendly_slime",cosmeticPack:"rimuru",adminBadge:"Administrador",exclusiveActionStyles:["predator","slime_burst","water_blade","azure_aura"],nativeSkills:["rimuru_water_jet","rimuru_predator"],waterJetEnergyCost:24,waterJetBaseDamage:15,waterJetDice:2,waterJetCriticalBonusDice:3,principalAttributes:3,canSpeakHumanLanguage:true,cannotUseShields:true,predatorStudySkill:"Estudos Esotéricos",synthesizedAbilityLimitAttribute:"Inteligência",synthesizedAbilityLimitFactor:.5,synthesizedAbilityLimitRounding:"ceil",capacityAttribute:"Inteligência",swallowedItemsArePermanent:true,swallowedItemSpecialEffects:true,regurgitateMaterialsSkill:"Criação",shapeshiftConsumedCreatures:true,shapeshiftCannotReturn:true,romanticAndSexualAttractionImmunity:true,healingBonus:.25,positiveDurationBonus:.4,spellRangeBonusMeters:3,fireDamageVulnerabilityMultiplier:3,darknessDamageVulnerabilityMultiplier:3,physicalDamagePenalty:.4,presenceTestPenalty:-2,cannotUseArmor:true},createdAt:"2026-08-29T00:00:00.000Z",updatedAt:"2026-08-29T00:00:00.000Z"}; }
function ensureSystemTrails(){ let changed=false;[["builtin_zero_energy",zeroEnergyTrail],["builtin_enchanter",enchanterTrail],["builtin_friendly_slime",friendlySlimeTrail]].forEach(([trailId,createTrail])=>{const canonical=createTrail(),existing=database.trails?.[trailId];if(!existing){database.trails[trailId]=canonical;changed=true;return;}if(trailId==="builtin_friendly_slime"&&(!Array.isArray(existing.mechanics?.nativeSkills)||!existing.mechanics.nativeSkills.includes("rimuru_water_jet")||!existing.mechanics.nativeSkills.includes("rimuru_predator"))){existing.mechanics={...(existing.mechanics||{}),...canonical.mechanics};existing.updatedAt=now();changed=true;}});return changed; }
if(ensureSystemTrails())saveDatabase();
function clamp(value,min,max){ return Math.min(max,Math.max(min,Number.isFinite(Number(value))?Number(value):min)); }
function gridSize(value,fallback){ return Math.round(clamp(value??fallback,2,100)); }
function mapZoom(value,fallback=1){ return clamp(value??fallback,.5,2.5); }
function imageData(value){ const image=typeof value==="string"?value:"";return /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(image)&&image.length<=10*1024*1024?image:""; }
function privateSheetCopy(raw){
  if(!raw||typeof raw!=="object")return null;
  try{
    const copy=JSON.parse(JSON.stringify(raw));
    delete copy.photo;
    return JSON.stringify(copy).length<=4*1024*1024?copy:null;
  }catch{return null;}
}
function normalizeMonsterSheet(raw){
  if(!raw||typeof raw!=="object")return null;
  const character=privateSheetCopy(raw.character||raw);
  if(!character)return null;
  return {sourceSheetId:typeof raw.sourceSheetId==="string"?raw.sourceSheetId.slice(0,100):"",character};
}
function defaultCombat(){ return {enabled:false,round:0,activeTokenId:"",turnOrder:[],initiatives:{},movementUsed:false}; }
function normalizeCombat(raw,tokens){
  const input=raw&&typeof raw==="object"?raw:{},ids=tokens.map((token)=>token.id),order=[],rawInitiatives=input.initiatives&&typeof input.initiatives==="object"?input.initiatives:{},initiatives={};
  (Array.isArray(input.turnOrder)?input.turnOrder:[]).forEach((tokenId)=>{if(typeof tokenId==="string"&&ids.includes(tokenId)&&!order.includes(tokenId))order.push(tokenId);});
  ids.forEach((tokenId)=>{if(!order.includes(tokenId))order.push(tokenId);});
  ids.forEach((tokenId)=>{const value=Number(rawInitiatives[tokenId]);initiatives[tokenId]=Number.isFinite(value)?Math.round(clamp(value,-9999,9999)):0;});
  const enabled=input.enabled===true&&order.length>0;
  return enabled?{enabled:true,round:Math.round(clamp(input.round??1,1,100000)),activeTokenId:order.includes(input.activeTokenId)?input.activeTokenId:order[0],turnOrder:order,initiatives,movementUsed:input.movementUsed===true}:defaultCombat();
}
function normalizeTokenConditions(raw,tokens){ const input=raw&&typeof raw==="object"?raw:{},ids=new Set(tokens.map((token)=>token.id)),conditions={};Object.entries(input).forEach(([tokenId,value])=>{if(!ids.has(tokenId)||!value||typeof value!=="object")return;const condition={wet:value.wet===true,immobilizedPending:value.immobilizedPending===true,immobilizedActive:value.immobilizedActive===true};if(condition.wet||condition.immobilizedPending||condition.immobilizedActive)conditions[tokenId]=condition;});return conditions; }
function defaultBoard(){ return {map:"",showGrid:true,gridColumns:20,gridRows:20,mapZoom:1,mediaVersion:id("media"),combat:defaultCombat(),conditions:{},tokens:[]}; }
function normalizeBoard(party){
  const raw=party.board&&typeof party.board==="object"?party.board:{},tokens=Array.isArray(raw.tokens)?raw.tokens:[],owners=new Set(tokens.map((token)=>token?.ownerMemberId).filter(Boolean));
  let addedPlayerToken=false;
  (party.members||[]).forEach((member,index)=>{if(owners.has(member.id))return;const rimuru=sheetMechanics(member.sheet).type==="friendly_slime",appearance=rimuruAppearance(member.sheet);tokens.push({id:id("token"),name:cleanName(member.name,member.sheet?.name),kind:"player",ownerMemberId:member.id,photo:rimuru?appearance.photo:imageData(member.sheet?.photo),form:rimuru?appearance.form:"",x:clamp(42+(index%5)*8,4,96),y:50,size:8});addedPlayerToken=true;});
  const normalizedTokens=tokens.map((token)=>{
    const kind=token?.kind==="monster"?"monster":"player";
    return {id:typeof token?.id==="string"&&token.id?token.id:id("token"),name:cleanName(token?.name,"Token"),kind,ownerMemberId:typeof token?.ownerMemberId==="string"?token.ownerMemberId:null,photo:imageData(token?.photo),form:token?.form==="human"?"human":token?.form==="slime"?"slime":"",x:clamp(token?.x??50,1,99),y:clamp(token?.y??50,1,99),size:clamp(token?.size??8,5,13),sheet:kind==="monster"?normalizeMonsterSheet(token?.sheet):null};
  });
  party.board={
    map:imageData(raw.map),showGrid:raw.showGrid!==false,gridColumns:gridSize(raw.gridColumns,20),gridRows:gridSize(raw.gridRows,20),mapZoom:mapZoom(raw.mapZoom),
    mediaVersion:addedPlayerToken?id("media"):(typeof raw.mediaVersion==="string"&&raw.mediaVersion?raw.mediaVersion:id("media")),
    combat:normalizeCombat(raw.combat,normalizedTokens),conditions:normalizeTokenConditions(raw.conditions,normalizedTokens),tokens:normalizedTokens
  };
  if(party.board.combat.enabled)snapCombatTokens(party.board);
  return party.board;
}
function publicBoard(party,includeMedia=false,includeMonsterSheets=false){
  const board=normalizeBoard(party);
  return {hasMap:Boolean(board.map),showGrid:board.showGrid,gridColumns:board.gridColumns,gridRows:board.gridRows,mapZoom:board.mapZoom,mediaVersion:board.mediaVersion,combat:board.combat,conditions:board.conditions,tokens:board.tokens.map((token)=>({id:token.id,name:token.name,kind:token.kind,ownerMemberId:token.ownerMemberId,form:token.form,x:token.x,y:token.y,size:token.size,...(includeMedia?{photo:token.photo}:{}),...(includeMonsterSheets&&token.kind==="monster"&&token.sheet?{sheet:token.sheet}:{})})),...(includeMedia?{map:board.map}:{})};
}
function combatCell(board,x,y){
  const columns=gridSize(board.gridColumns,20),rows=gridSize(board.gridRows,20);
  return {column:Math.min(columns-1,Math.max(0,Math.floor(clamp(x,0,99.999)/100*columns))),row:Math.min(rows-1,Math.max(0,Math.floor(clamp(y,0,99.999)/100*rows))),columns,rows};
}
function snapCombatTokens(board){
  const occupied=new Set();
  board.tokens.forEach((token)=>{
    const preferred=combatCell(board,token.x,token.y);
    let destination=null;
    for(let distance=0;!destination&&distance<preferred.columns+preferred.rows;distance++){
      for(let row=0;row<preferred.rows;row++)for(let column=0;column<preferred.columns;column++){
        if(Math.abs(column-preferred.column)+Math.abs(row-preferred.row)!==distance||occupied.has(`${column}:${row}`))continue;
        destination={column,row,columns:preferred.columns,rows:preferred.rows};break;
      }
    }
    if(!destination)return;
    occupied.add(`${destination.column}:${destination.row}`);
    token.x=((destination.column+.5)/destination.columns)*100;
    token.y=((destination.row+.5)/destination.rows)*100;
  });
}
function sheetMovement(sheet){ const mechanics=sheetMechanics(sheet),raw=Number(sheet?.movementAction),base=Number.isFinite(raw)?raw:2;return Math.max(0,Math.round(clamp(base,0,100))+Math.round(Number(mechanics.movementBonus)||0)); }
function transitionCombatConditions(board,previousTokenId,nextTokenId){ const conditions=board.conditions||{};if(previousTokenId&&previousTokenId!==nextTokenId&&conditions[previousTokenId]?.immobilizedActive)conditions[previousTokenId]={...conditions[previousTokenId],immobilizedActive:false};if(nextTokenId&&previousTokenId!==nextTokenId&&conditions[nextTokenId]?.immobilizedPending)conditions[nextTokenId]={...conditions[nextTokenId],immobilizedPending:false,immobilizedActive:true};board.conditions=normalizeTokenConditions(conditions,board.tokens); }
function advanceCombatTurn(board){
  const combat=normalizeCombat(board.combat,board.tokens);
  if(!combat.enabled)return;
  const currentIndex=Math.max(0,combat.turnOrder.indexOf(combat.activeTokenId)),nextIndex=(currentIndex+1)%combat.turnOrder.length;
  const previousTokenId=combat.activeTokenId,nextTokenId=combat.turnOrder[nextIndex];
  board.combat={...combat,round:combat.round+(nextIndex===0?1:0),activeTokenId:combat.turnOrder[nextIndex],movementUsed:false};
  transitionCombatConditions(board,previousTokenId,nextTokenId);
}
function moveCombatToken(party,board,token,x,y){
  const combat=board.combat;
  if(combat.activeTokenId!==token.id)throw new Error("Aguarde o turno deste token.");
  if(board.conditions?.[token.id]?.immobilizedActive)throw new Error("Este token está imobilizado pelo Jato de Água e não pode se mover neste turno.");
  if(combat.movementUsed)throw new Error("Este token já usou a ação de movimento neste turno.");
  const source=combatCell(board,token.x,token.y),destination=combatCell(board,x,y),distance=Math.abs(source.column-destination.column)+Math.abs(source.row-destination.row);
  if(!distance)throw new Error("Escolha outra célula para mover.");
  const movement=sheetMovement(tokenCharacter(party,token)),sprint=movement*2;
  if(distance>sprint)throw new Error(`Este token pode alcançar até ${sprint} m nesta ação de movimento.`);
  if(board.tokens.some((other)=>other.id!==token.id&&combatCell(board,other.x,other.y).column===destination.column&&combatCell(board,other.x,other.y).row===destination.row))throw new Error("Essa célula já está ocupada.");
  token.x=((destination.column+.5)/destination.columns)*100;
  token.y=((destination.row+.5)/destination.rows)*100;
  combat.movementUsed=true;
  if(distance>movement)advanceCombatTurn(board);
}
function bumpBoardMedia(party){ normalizeBoard(party).mediaVersion=id("media"); }
function respond(response,status,payload){ response.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});response.end(JSON.stringify(payload)); }
function message(response,status,error){ respond(response,status,{error}); }
function readJson(request){ return new Promise((resolve,reject)=>{let bytes=0,body="";request.on("data",(chunk)=>{bytes+=chunk.length;if(bytes>MAX_BODY_BYTES){reject(new Error("A requisição é grande demais."));request.destroy();return;}body+=chunk;});request.on("end",()=>{try{resolve(body?JSON.parse(body):{});}catch{reject(new Error("JSON inválido."));}});request.on("error",reject);}); }
function cleanActionVisual(visual={}){ const styles=["projectile","slash","burst","aura","predator","slime_burst","water_blade","azure_aura","water_jet"],color=/^#[0-9a-f]{6}$/i.test(visual.color||"")?visual.color:"#f6aa52",image=imageData(visual.image);return {style:styles.includes(visual.style)?visual.style:"projectile",color,duration:Math.round(clamp(visual.duration??900,300,2200)),image:image.length<=3*1024*1024?image:""}; }
function cleanCombatAction(action={}){ const types=["principal","secundaria","movimento"],damageTypes=["physical","supernatural","effect","sanity"],specials=["rimuru_water_jet","rimuru_predator"],special=specials.includes(action.special)?action.special:"";return {name:cleanName(action.name,"Ação"),description:String(action.description||"").slice(0,110),actionType:types.includes(action.actionType)?action.actionType:"principal",combatSkill:typeof action.combatSkill==="string"?action.combatSkill.slice(0,80):"",damageType:damageTypes.includes(action.damageType)?action.damageType:"physical",targetMage:action.targetMage===true,rest:action.rest===true,special,damage:Math.round(clamp(action.damage??0,0,100000)),penetration:Math.round(clamp(action.penetration??0,0,100000)),energyCost:Math.round(clamp(action.energyCost??0,0,100000)),visual:cleanActionVisual(action.visual)}; }
function normalizeEvents(party){ const events=Array.isArray(party.events)?party.events:[];party.events=events.slice(-16).map((event)=>({id:typeof event?.id==="string"&&event.id?event.id:id("event"),sourceTokenId:typeof event?.sourceTokenId==="string"?event.sourceTokenId:"",targetTokenId:typeof event?.targetTokenId==="string"?event.targetTokenId:"",action:cleanCombatAction(event?.action),result:event?.result&&typeof event.result==="object"?{damage:Math.round(clamp(event.result.damage,0,100000)),damageResource:event.result.damageResource==="sanity"?"sanity":"hp",energySpent:Math.round(clamp(event.result.energySpent,0,100000)),energyRestored:Math.round(clamp(event.result.energyRestored,0,100000)),collapseDamage:Math.round(clamp(event.result.collapseDamage,0,100000)),resourceLabel:cleanName(event.result.resourceLabel,"Energia"),targetName:cleanName(event.result.targetName,"Alvo"),ability:["rimuru_water_jet","rimuru_predator"].includes(event.result.ability)?event.result.ability:"",critical:event.result.critical===true,criticalCheck:Math.round(clamp(event.result.criticalCheck,1,20)),intelligence:Math.round(clamp(event.result.intelligence,-100,100)),dieSides:Math.round(clamp(event.result.dieSides,1,100)),dice:Array.isArray(event.result.dice)?event.result.dice.slice(0,5).map((roll)=>Math.round(clamp(roll,1,100))):[],baseDamage:Math.round(clamp(event.result.baseDamage,0,100000)),rawDamage:Math.round(clamp(event.result.rawDamage,0,100000)),wet:event.result.wet===true,immobilizedNextTurn:event.result.immobilizedNextTurn===true} : null,createdAt:typeof event?.createdAt==="string"?event.createdAt:now()}));return party.events; }
function publicEvent(event){ return {id:event.id,sourceTokenId:event.sourceTokenId,targetTokenId:event.targetTokenId,action:event.action,result:event.result,createdAt:event.createdAt}; }
function getParty(partyId){ const party=database.parties[partyId];if(party){normalizeBoard(party);normalizeEvents(party);}return party; }
function publicParty(party,includeMedia=false,includeMonsterSheets=false){ return {id:party.id,title:party.title,createdAt:party.createdAt,board:publicBoard(party,includeMedia,includeMonsterSheets),events:normalizeEvents(party).map(publicEvent)}; }
function publicMember(member){ return {id:member.id,name:member.name,joinedAt:member.joinedAt,updatedAt:member.updatedAt,sheet:member.sheet}; }
function ownMember(member){ return {...publicMember(member),privateNotes:String(member?.privateNotes||"").slice(0,20000)}; }
function timingSafeEqual(a,b){ return a.length===b.length&&crypto.timingSafeEqual(a,b); }
function isHost(party,key){ return Boolean(party&&key&&timingSafeEqual(Buffer.from(party.hostKey),Buffer.from(String(key)))); }
function isMember(member,key){ return Boolean(member&&key&&timingSafeEqual(Buffer.from(member.key),Buffer.from(String(key)))); }
function cleanName(value,fallback){ return String(value||fallback||"Jogador").trim().slice(0,60)||"Jogador"; }
function cleanTrailText(value,max=700){ return String(value||"").trim().slice(0,max); }
function publicTrail(trail){ return {id:trail.id,name:trail.name,summary:trail.summary,details:trail.details,mechanics:trail.mechanics&&typeof trail.mechanics==="object"?trail.mechanics:null,createdAt:trail.createdAt,updatedAt:trail.updatedAt}; }
function normalizeTrail(raw){ if(!raw||typeof raw!=="object"||typeof raw.id!=="string"||!raw.id)return null;return {id:raw.id,name:cleanName(raw.name,"Trilha sem nome"),summary:cleanTrailText(raw.summary,240),details:cleanTrailText(raw.details,2000),mechanics:raw.mechanics&&typeof raw.mechanics==="object"?raw.mechanics:null,codeSalt:typeof raw.codeSalt==="string"?raw.codeSalt:"",codeHash:typeof raw.codeHash==="string"?raw.codeHash:"",createdAt:typeof raw.createdAt==="string"?raw.createdAt:now(),updatedAt:typeof raw.updatedAt==="string"?raw.updatedAt:now()}; }
function hashTrailCode(code,salt){ return crypto.scryptSync(String(code),salt,64).toString("hex"); }
function validTrailCode(code){ return typeof code==="string"&&code.trim().length>=4&&code.trim().length<=80; }
function activeTrailAdminSession(key){ const session=database.trailAdminSessions?.[String(key||"")];if(!session||Number(session.expiresAt)<=Date.now())return false;return true; }
function cleanExpiredTrailAdminSessions(){ let changed=false;Object.entries(database.trailAdminSessions||{}).forEach(([key,session])=>{if(Number(session?.expiresAt)<=Date.now()){delete database.trailAdminSessions[key];changed=true;}});return changed; }
function trailAdminKey(body,url){ return body?.adminKey||url?.searchParams?.get("adminKey")||""; }
function requireTrailAdmin(response,body,url){ if(!activeTrailAdminSession(trailAdminKey(body,url))){message(response,401,"Acesso de Mestre inválido ou expirado.");return false;}return true; }
function trailRecordFromInput(input,existing=null){ const name=cleanTrailText(input?.name,60),code=input?.code;if(!name)throw new Error("Informe o nome da trilha.");if(!existing&&!validTrailCode(code))throw new Error("O código da trilha deve ter entre 4 e 80 caracteres.");const trail={...(existing||{}),id:existing?.id||id("trail"),name,summary:cleanTrailText(input?.summary,240),details:cleanTrailText(input?.details,2000),createdAt:existing?.createdAt||now(),updatedAt:now()};if(validTrailCode(code)){trail.codeSalt=crypto.randomBytes(16).toString("hex");trail.codeHash=hashTrailCode(code.trim(),trail.codeSalt);}return trail; }
function sheetSkill(sheet,name){ return Math.max(0,Number(sheet?.skills?.[name])||0); }
function sheetCombatSkill(sheet,name){ return Math.max(0,Number(sheet?.combatSkills?.[name])||0); }
function sheetMechanics(sheet){ return sheet?.customTrail?.mechanics&&typeof sheet.customTrail.mechanics==="object"?sheet.customTrail.mechanics:{}; }
function rimuruAppearance(sheet){ const cosmetics=sheetMechanics(sheet).type==="friendly_slime"&&sheet?.rimuruCosmetics&&typeof sheet.rimuruCosmetics==="object"?sheet.rimuruCosmetics:{},form=cosmetics.activeForm==="human"?"human":"slime",slimeImage=imageData(cosmetics.slimeImage),humanImage=imageData(cosmetics.humanImage)||imageData(sheet?.photo);return {form,photo:form==="human"?humanImage:slimeImage}; }
function sheetDerived(sheet){ const attributes=sheet?.attributes||{},mechanics=sheetMechanics(sheet),con=Number(attributes["Constituição"])||0,int=Number(attributes["Inteligência"])||0,dex=Number(attributes["Destreza"])||0,pre=Number(attributes["Presença"])||0,progression=sheet?.progression||{},isNpc=sheet?.characterType==="npc",zeroEnergy=mechanics.type==="zero_energy",base=sheet?.npcTier==="Chefe"?160:70,inventory=Array.isArray(sheet?.inventory)?sheet.inventory:[],equipped=inventory.filter((item)=>item?.equipped).reduce((sum,item)=>sum+(Number(item.defense)||0)*Math.max(1,Number(item.quantity)||1),0),defenseSkill=Math.floor(sheetCombatSkill(sheet,"Equipamentos de Defesa")/2);return {hpMax:Math.max(1,isNpc?base+con*10+(Number(progression.hpLevelBonus)||0):70+con*15+(Number(mechanics.hpBonus)||0)+(Number(progression.hpLevelBonus)||0)),energyMax:Math.max(0,zeroEnergy?70+dex*15+(Number(progression.energyLevelBonus)||0):(isNpc?base+int*10:70+int*15)+(Number(progression.energyLevelBonus)||0)),sanityMax:Math.max(0,70+pre*15+(Number(progression.sanityLevelBonus)||0)),defense:(Number(sheet?.manualDefense)||0)+equipped+defenseSkill,zeroEnergy,mechanics,resourceLabel:zeroEnergy?"Stamina":"Energia"}; }
function tokenCharacter(party,token){ if(token.kind==="monster")return token.sheet?.character||null;return party.members.find((member)=>member.id===token.ownerMemberId)?.sheet||null; }
function setTokenCharacter(party,token,character){ if(token.kind==="monster"){if(!token.sheet)return false;token.sheet.character=character;return true;}const member=party.members.find((entry)=>entry.id===token.ownerMemberId);if(!member)return false;member.sheet=character;member.updatedAt=now();return true; }
function resolveIncomingDamage(targetSheet,input={}){
  const target=targetSheet?.resources||{},derived=sheetDerived(targetSheet),mechanics=derived.mechanics,rawDamage=Math.round(clamp(input.rawDamage,0,100000)),penetration=Math.round(clamp(input.penetration,0,100000)),damageType=["physical","supernatural","effect","sanity"].includes(input.damageType)?input.damageType:"physical";
  const physical=sheetSkill(targetSheet,"Resistência Física"),supernatural=sheetSkill(targetSheet,"Resistência ao Sobrenatural"),effects=sheetSkill(targetSheet,"Resistência a Efeitos");
  let resistance=physical,resistanceLabel="Resistência Física",defenseFactor=Math.max(0,1-.01*Math.max(0,derived.defense-penetration)),resistanceFactor=Math.max(0,1-.05*physical),trailFactor=1,damageResource="hp",finalDamage=0;
  if(damageType==="sanity"){
    resistance=0;resistanceLabel="Sanidade";defenseFactor=1;resistanceFactor=1;trailFactor=1+Math.max(0,Number(mechanics.sanityDamageVulnerability)||0);damageResource="sanity";finalDamage=Math.max(0,Math.round(rawDamage*trailFactor));
  }else if(damageType==="effect"){
    resistance=effects;resistanceLabel="Resistência a Efeitos";defenseFactor=1;resistanceFactor=1;finalDamage=Math.max(0,rawDamage-effects);
  }else{
    if(damageType==="supernatural"){resistance=supernatural;resistanceLabel="Resistência ao Sobrenatural";resistanceFactor=Math.max(0,1-.05*supernatural);trailFactor=1+(Number(mechanics.supernaturalDamageVulnerability)||0);}
    else trailFactor=1-Math.max(0,Number(mechanics.physicalDamageReduction)||0);
    finalDamage=Math.max(0,Math.round(rawDamage*defenseFactor*resistanceFactor*Math.max(0,trailFactor)));
  }
  const resourceKey=damageResource==="sanity"?"sanityCurrent":"hpCurrent",resourceMax=damageResource==="sanity"?derived.sanityMax:derived.hpMax,before=Math.max(0,Math.min(resourceMax,Number(target[resourceKey])||0)),after=Math.max(0,before-finalDamage);
  targetSheet.resources={...target,hpCurrent:damageResource==="hp"?after:Math.max(0,Math.min(derived.hpMax,Number(target.hpCurrent)||0)),energyCurrent:derived.zeroEnergy?Math.max(-1000,Math.min(derived.energyMax,Number(target.energyCurrent)||0)):Math.max(0,Math.min(derived.energyMax,Number(target.energyCurrent)||0)),sanityCurrent:damageResource==="sanity"?after:Math.max(0,Math.min(derived.sanityMax,Number(target.sanityCurrent)||0))};
  return {rawDamage,finalDamage,before,after,damageResource,damageType,penetration,defense:derived.defense,resistance,resistanceLabel,defenseFactor,resistanceFactor,trailFactor};
}
function resolveActionDamage(sourceSheet,targetSheet,action){ const source=sourceSheet?.resources||{},target=targetSheet?.resources||{},sourceMax=sheetDerived(sourceSheet),targetMax=sheetDerived(targetSheet),currentResource=Math.min(sourceMax.energyMax,Number(source.energyCurrent)||0),sourceMechanics=sourceMax.mechanics,targetMechanics=targetMax.mechanics;if(sourceMax.zeroEnergy&&action.damageType==="supernatural")throw new Error("Esta trilha não pode usar ações sobrenaturais ou mágicas.");if(sourceMax.zeroEnergy&&currentResource<=0&&action.energyCost>0)throw new Error("O personagem está em colapso e precisa de descanso do Mestre.");if(!sourceMax.zeroEnergy&&action.energyCost>Math.max(0,currentResource))throw new Error("Energia insuficiente para usar esta ação.");const skill=sheetCombatSkill(sourceSheet,action.combatSkill),physicalDamageModifier=action.damageType==="physical"?(Number(sourceMechanics.physicalDamageBonus)||0)-(Number(sourceMechanics.physicalDamagePenalty)||0):0,sourceDamageFactor=Math.max(0,1+physicalDamageModifier+(action.targetMage?Number(sourceMechanics.mageDamageBonus)||0:0)),raw=Math.round(action.damage*(1+.03*skill)*sourceDamageFactor),effects=sheetSkill(targetSheet,"Resistência a Efeitos"),resistance=action.damageType==="physical"?sheetSkill(targetSheet,"Resistência Física"):sheetSkill(targetSheet,"Resistência ao Sobrenatural");let finalDamage,damageResource="hp";if(action.damageType==="sanity"){damageResource="sanity";finalDamage=Math.max(0,Math.round(raw*(1+Math.max(0,Number(targetMechanics.sanityDamageVulnerability)||0))));}else if(action.damageType==="effect")finalDamage=Math.max(0,raw-effects);else{const trailDamageFactor=action.damageType==="physical"?1-Math.max(0,Number(targetMechanics.physicalDamageReduction)||0):1+(Number(targetMechanics.supernaturalDamageVulnerability)||0);finalDamage=Math.max(0,Math.round(raw*Math.max(0,1-.01*Math.max(0,targetMax.defense-action.penetration))*Math.max(0,1-.05*resistance)*trailDamageFactor));}const nextResource=currentResource-action.energyCost,collapseDamage=sourceMax.zeroEnergy?Math.max(0,-nextResource)*(Number(sourceMechanics.negativeStaminaDamage)||4):0;sourceSheet.resources={...source,hpCurrent:Math.max(0,Math.min(sourceMax.hpMax,(Number(source.hpCurrent)||0)-collapseDamage)),energyCurrent:sourceMax.zeroEnergy?Math.max(-1000,nextResource):Math.max(0,nextResource),sanityCurrent:Math.max(0,Math.min(sourceMax.sanityMax,Number(source.sanityCurrent)||0))};targetSheet.resources={...target,hpCurrent:damageResource==="hp"?Math.max(0,Math.min(targetMax.hpMax,(Number(target.hpCurrent)||0)-finalDamage)):Math.max(0,Math.min(targetMax.hpMax,Number(target.hpCurrent)||0)),energyCurrent:targetMax.zeroEnergy?Math.max(-1000,Math.min(targetMax.energyMax,Number(target.energyCurrent)||0)):Math.max(0,Math.min(targetMax.energyMax,Number(target.energyCurrent)||0)),sanityCurrent:damageResource==="sanity"?Math.max(0,Math.min(targetMax.sanityMax,(Number(target.sanityCurrent)||0)-finalDamage)):Math.max(0,Math.min(targetMax.sanityMax,Number(target.sanityCurrent)||0))};return {damage:finalDamage,damageResource,energySpent:action.energyCost,collapseDamage,resourceLabel:sourceMax.resourceLabel}; }
function resolveRimuruWaterJet(sourceSheet,targetSheet,action){ if(sheetMechanics(sourceSheet).type!=="friendly_slime")throw new Error("Jato de Água pertence à trilha Eu Não Sou um Slime Malvado.");const intelligence=Math.round(Number(sourceSheet?.attributes?.["Inteligência"])||0),dieSides=Math.max(1,intelligence),criticalCheck=crypto.randomInt(1,21),critical=criticalCheck===20,diceCount=2+(critical?3:0),dice=Array.from({length:diceCount},()=>crypto.randomInt(1,dieSides+1)),baseDamage=15,rawDamage=baseDamage+dice.reduce((sum,roll)=>sum+roll,0),canonical={...action,name:"Jato de Água",description:"Concentra umidade e dispara um jato de alta pressão. O alvo fica Molhado.",actionType:"principal",damageType:"supernatural",damage:rawDamage,penetration:0,energyCost:24,special:"rimuru_water_jet",visual:{style:"water_jet",color:"#65dcff",duration:1800,image:""}},result=resolveActionDamage(sourceSheet,targetSheet,canonical);return {action:canonical,result:{...result,ability:"rimuru_water_jet",critical,criticalCheck,intelligence,dieSides,dice,baseDamage,rawDamage,wet:true,immobilizedNextTurn:critical}}; }
function isInside(target,folder){ return target===folder||target.startsWith(`${folder}${path.sep}`); }
function serveStatic(request,response,url){ let relative=url.pathname==="/"?"/index.html":url.pathname;try{relative=decodeURIComponent(relative);}catch{return message(response,400,"Endereço inválido.");}const target=path.resolve(ROOT,`.${relative}`);if(!PUBLIC_FILES.has(url.pathname)||!isInside(target,ROOT)||isInside(target,DATA_DIR)){return message(response,403,"Acesso negado.");}fs.readFile(target,(error,content)=>{if(error){if(error.code==="ENOENT")return message(response,404,"Arquivo não encontrado.");return message(response,500,"Não foi possível abrir o arquivo.");}response.writeHead(200,{"Content-Type":MIME_TYPES[path.extname(target)]||"application/octet-stream","Cache-Control":"no-store"});response.end(content);}); }

async function handleTrailsApi(request,response,url,parts){
  if(parts.length===3&&parts[2]==="unlock"&&request.method==="POST"){
    const body=await readJson(request),code=typeof body.code==="string"?body.code.trim():"";
    if(!validTrailCode(code))return message(response,400,"Informe o código da trilha.");
    const trail=Object.values(database.trails||{}).map(normalizeTrail).find((entry)=>entry?.codeSalt&&entry.codeHash&&timingSafeEqual(Buffer.from(entry.codeHash,"hex"),Buffer.from(hashTrailCode(code,entry.codeSalt),"hex")));
    if(!trail)return message(response,404,"Código de trilha inválido.");
    return respond(response,200,{trail:publicTrail(trail)});
  }
  if(parts.length===4&&parts[2]==="admin"&&parts[3]==="login"&&request.method==="POST"){
    const body=await readJson(request),password=typeof body.password==="string"?body.password:"";
    if(!TRAIL_ADMIN_PASSWORD)return message(response,503,"A senha de Mestre ainda não foi configurada no Railway.");
    if(!timingSafeEqual(Buffer.from(TRAIL_ADMIN_PASSWORD),Buffer.from(password)))return message(response,401,"Senha de Mestre incorreta.");
    cleanExpiredTrailAdminSessions();const adminKey=id("trail_admin");database.trailAdminSessions[adminKey]={expiresAt:Date.now()+TRAIL_ADMIN_SESSION_MS};saveDatabase();return respond(response,200,{adminKey,expiresAt:database.trailAdminSessions[adminKey].expiresAt});
  }
  if(parts.length===3&&parts[2]==="admin"&&request.method==="GET"){
    if(!requireTrailAdmin(response,null,url))return;const trails=Object.values(database.trails||{}).map(normalizeTrail).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")).map(publicTrail);return respond(response,200,{trails});
  }
  if(parts.length===3&&parts[2]==="admin"&&request.method==="POST"){
    const body=await readJson(request);if(!requireTrailAdmin(response,body,url))return;const trail=trailRecordFromInput(body.trail);database.trails[trail.id]=trail;saveDatabase();return respond(response,201,{trail:publicTrail(trail)});
  }
  if(parts.length===4&&parts[2]==="admin"&&request.method==="PUT"){
    const body=await readJson(request);if(!requireTrailAdmin(response,body,url))return;const current=normalizeTrail(database.trails?.[parts[3]]);if(!current)return message(response,404,"Trilha não encontrada.");const trail=trailRecordFromInput(body.trail,current);database.trails[trail.id]=trail;saveDatabase();return respond(response,200,{trail:publicTrail(trail)});
  }
  if(parts.length===4&&parts[2]==="admin"&&request.method==="DELETE"){
    const body=await readJson(request);if(!requireTrailAdmin(response,body,url))return;if(!database.trails?.[parts[3]])return message(response,404,"Trilha não encontrada.");delete database.trails[parts[3]];saveDatabase();return respond(response,200,{ok:true});
  }
  return message(response,404,"Rota de trilhas não encontrada.");
}

async function handleApi(request,response,url){
  const parts=url.pathname.split("/").filter(Boolean);
  if(parts[1]==="trails")return handleTrailsApi(request,response,url,parts);
  if(parts[1]!=="parties")return message(response,404,"Rota não encontrada.");
  if(parts.length===2&&request.method==="POST"){
    const body=await readJson(request),party={id:id("party"),title:cleanName(body.title,"Party do Mestre"),hostKey:id("host"),createdAt:now(),members:[],board:defaultBoard(),events:[]};
    database.parties[party.id]=party;saveDatabase();return respond(response,201,{party:publicParty(party),hostKey:party.hostKey});
  }
  const party=getParty(parts[2]);if(!party)return message(response,404,"Party não encontrada. Confira o link de convite.");
  if(parts.length===3&&request.method==="GET"){
    const includeMedia=url.searchParams.get("includeMedia")==="1",hostKey=url.searchParams.get("hostKey");if(isHost(party,hostKey))return respond(response,200,{party:publicParty(party,includeMedia,true),role:"host",members:party.members.map(publicMember)});
    const member=party.members.find((entry)=>entry.id===url.searchParams.get("memberId"));if(isMember(member,url.searchParams.get("memberKey")))return respond(response,200,{party:publicParty(party,includeMedia),role:"player",member:ownMember(member)});
    return message(response,401,"Não foi possível validar seu acesso a esta party.");
  }
  if(parts.length===4&&parts[3]==="join"&&request.method==="POST"){
    const body=await readJson(request);if(!body.sheet||typeof body.sheet!=="object")return message(response,400,"Escolha uma ficha antes de entrar.");
    const member={id:id("member"),key:id("player"),name:cleanName(body.name,body.sheet.name),sheet:body.sheet,privateNotes:"",joinedAt:now(),updatedAt:now()};party.members.push(member);normalizeBoard(party);bumpBoardMedia(party);saveDatabase();return respond(response,201,{party:publicParty(party,true),member:ownMember(member),memberKey:member.key});
  }
  if(parts.length===4&&parts[3]==="events"&&request.method==="POST"){
    const body=await readJson(request),member=party.members.find((entry)=>entry.id===body.memberId);if(!isMember(member,body.memberKey))return message(response,401,"Não foi possível validar sua ação.");const board=normalizeBoard(party),source=board.tokens.find((token)=>token.id===body.sourceTokenId),target=board.tokens.find((token)=>token.id===body.targetTokenId);if(!source||!target)return message(response,404,"Escolha um token válido na mesa.");if(source.ownerMemberId!==member.id)return message(response,401,"Você só pode usar ações a partir do seu próprio token.");if(board.combat.enabled&&board.combat.activeTokenId!==source.id)return message(response,403,"Aguarde o turno do token ativo.");let action=cleanCombatAction(body.action);const sourceSheet=tokenCharacter(party,source),targetSheet=tokenCharacter(party,target);if(!sourceSheet)return message(response,400,"A ficha de origem não está disponível.");let result={damage:0,energySpent:0,targetName:target.name};if(action.special==="rimuru_water_jet"){if(source.id===target.id)return message(response,400,"Escolha outro token como alvo do Jato de Água.");if(!targetSheet)return message(response,400,"O alvo precisa de uma ficha vinculada para receber o Jato de Água.");const resolved=resolveRimuruWaterJet(sourceSheet,targetSheet,action);action=resolved.action;result={...resolved.result,targetName:target.name};board.conditions[target.id]={...(board.conditions[target.id]||{}),wet:true,...(result.critical?{immobilizedPending:true}:{})};setTokenCharacter(party,source,sourceSheet);setTokenCharacter(party,target,targetSheet);}else if(action.special==="rimuru_predator"){if(sheetMechanics(sourceSheet).type!=="friendly_slime")return message(response,403,"Predador pertence à trilha Eu Não Sou um Slime Malvado.");action={...action,name:"Predador",description:"Manifesta uma espiral negra de absorção. A devoração e a síntese são resolvidas manualmente.",actionType:"principal",damageType:"effect",damage:0,penetration:0,energyCost:0,special:"rimuru_predator",visual:{style:"predator",color:"#7546c9",duration:1900,image:""}};result={damage:0,energySpent:0,targetName:target.name,ability:"rimuru_predator"};}else if(action.rest){const sourceMax=sheetDerived(sourceSheet);if(!sourceMax.zeroEnergy)return message(response,400,"Somente personagens com Stamina podem usar Repouso.");const current=Math.min(sourceMax.energyMax,Number(sourceSheet.resources?.energyCurrent)||0),restored=Math.max(0,Math.min(sourceMax.energyMax,current+Math.max(0,Number(sourceMax.mechanics.staminaRest)||12))-current);sourceSheet.resources={...(sourceSheet.resources||{}),energyCurrent:current+restored};result={damage:0,energySpent:0,energyRestored:restored,resourceLabel:sourceMax.resourceLabel,targetName:source.name||"Personagem"};setTokenCharacter(party,source,sourceSheet);}else if(action.damage>0||action.energyCost>0){if(!targetSheet)return message(response,400,"O alvo não possui uma ficha vinculada para receber dano.");result={...resolveActionDamage(sourceSheet,targetSheet,action),targetName:target.name};setTokenCharacter(party,source,sourceSheet);setTokenCharacter(party,target,targetSheet);}const event={id:id("event"),sourceTokenId:source.id,targetTokenId:target.id,action,result,createdAt:now()};normalizeEvents(party).push(event);party.events=party.events.slice(-16);saveDatabase();return respond(response,201,{event:publicEvent(event)});
  }
  if(parts.length===5&&parts[3]==="members"&&request.method==="PUT"){
    const member=party.members.find((entry)=>entry.id===parts[4]);const body=await readJson(request);if(!isMember(member,body.memberKey))return message(response,401,"Não foi possível validar sua ficha.");if(!body.sheet||typeof body.sheet!=="object")return message(response,400,"A ficha enviada é inválida.");member.sheet=body.sheet;member.name=cleanName(body.name,body.sheet.name);member.updatedAt=now();const board=normalizeBoard(party),token=board.tokens.find((entry)=>entry.ownerMemberId===member.id);if(token){const rimuru=sheetMechanics(member.sheet).type==="friendly_slime",appearance=rimuruAppearance(member.sheet),photo=rimuru?appearance.photo:imageData(member.sheet.photo),form=rimuru?appearance.form:"",mediaChanged=token.photo!==photo||token.form!==form;token.name=member.name;token.photo=photo;token.form=form;if(mediaChanged)bumpBoardMedia(party);}saveDatabase();return respond(response,200,{member:ownMember(member),board:publicBoard(party,true)});
  }
  if(parts.length===6&&parts[3]==="members"&&parts[5]==="notes"&&request.method==="PUT"){
    const member=party.members.find((entry)=>entry.id===parts[4]),body=await readJson(request);
    if(!isMember(member,body.memberKey))return message(response,401,"Somente o próprio jogador pode acessar estas anotações.");
    member.privateNotes=String(body.privateNotes||"").slice(0,20000);
    member.updatedAt=now();saveDatabase();
    return respond(response,200,{privateNotes:member.privateNotes,updatedAt:member.updatedAt});
  }
  if(parts.length===6&&parts[3]==="members"&&parts[5]==="master-sheet"&&request.method==="PUT"){
    const member=party.members.find((entry)=>entry.id===parts[4]),body=await readJson(request);
    if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode editar esta ficha.");
    if(!member)return message(response,404,"Ficha do jogador não encontrada.");
    const patch=body.patch;
    if(!patch||typeof patch!=="object")return message(response,400,"As informações enviadas são inválidas.");
    const currentResources=member.sheet?.resources||{},patchResources=patch.resources&&typeof patch.resources==="object"?patch.resources:{};
    const specialStamina=sheetDerived(member.sheet).zeroEnergy;
    const resources={
      ...currentResources,
      ...(Object.hasOwn(patchResources,"hpCurrent")?{hpCurrent:Math.round(clamp(patchResources.hpCurrent,0,100000))}:{}),
      ...(Object.hasOwn(patchResources,"energyCurrent")?{energyCurrent:Math.round(clamp(patchResources.energyCurrent,specialStamina?-1000:0,100000))}:{}),
      ...(Object.hasOwn(patchResources,"sanityCurrent")?{sanityCurrent:Math.round(clamp(patchResources.sanityCurrent,0,100000))}:{})
    };
    const name=Object.hasOwn(patch,"name")?cleanName(patch.name,member.name):member.name;
    member.sheet={...member.sheet,name,resources,...(Object.hasOwn(patch,"manualDefense")?{manualDefense:Math.round(clamp(patch.manualDefense,-100,100000))}:{}),...(Object.hasOwn(patch,"xp")?{xp:Math.round(clamp(patch.xp,0,10000000))}:{})};
    member.name=name;
    member.updatedAt=now();
    const board=normalizeBoard(party),token=board.tokens.find((entry)=>entry.ownerMemberId===member.id);
    if(token)token.name=member.name;
    saveDatabase();
    return respond(response,200,{member:publicMember(member)});
  }
  if(parts.length===6&&parts[3]==="members"&&parts[5]==="rest"&&request.method==="POST"){
    const member=party.members.find((entry)=>entry.id===parts[4]),body=await readJson(request);
    if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode aplicar descanso.");
    if(!member)return message(response,404,"Ficha do jogador não encontrada.");
    const resources=body.resources;
    if(!resources||typeof resources!=="object")return message(response,400,"Os recursos enviados são inválidos.");
    const specialStamina=sheetDerived(member.sheet).zeroEnergy;
    member.sheet={...member.sheet,resources:{...(member.sheet?.resources||{}),hpCurrent:Math.round(clamp(resources.hpCurrent,0,100000)),energyCurrent:Math.round(clamp(resources.energyCurrent,specialStamina?-1000:0,100000)),sanityCurrent:Math.round(clamp(resources.sanityCurrent,0,100000))}};
    member.updatedAt=now();
    saveDatabase();
    return respond(response,200,{member:publicMember(member)});
  }
  if(parts.length===4&&parts[3]==="board"&&request.method==="PUT"){
    const body=await readJson(request);
    if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode alterar o mapa.");
    const board=normalizeBoard(party);
    let mediaChanged=false;
    if(Object.hasOwn(body,"map")){const map=imageData(body.map);if(body.map&&!map)return message(response,400,"A imagem do mapa é inválida ou grande demais.");if(board.map!==map){board.map=map;mediaChanged=true;}}
    if(Object.hasOwn(body,"showGrid"))board.showGrid=Boolean(body.showGrid);
    if(Object.hasOwn(body,"gridColumns"))board.gridColumns=gridSize(body.gridColumns,board.gridColumns);
    if(Object.hasOwn(body,"gridRows"))board.gridRows=gridSize(body.gridRows,board.gridRows);
    if(Object.hasOwn(body,"mapZoom"))board.mapZoom=mapZoom(body.mapZoom,board.mapZoom);
    if(Object.hasOwn(body,"combat")){
      if(!body.combat||typeof body.combat!=="object")return message(response,400,"Os dados de combate são inválidos.");
      const input=body.combat,current=board.combat||defaultCombat(),next={...current};
      if(Object.hasOwn(input,"enabled"))next.enabled=input.enabled===true;
      if(Object.hasOwn(input,"round"))next.round=Math.round(clamp(input.round,1,100000));
      if(Array.isArray(input.turnOrder))next.turnOrder=input.turnOrder;
      if(input.initiatives&&typeof input.initiatives==="object")next.initiatives=input.initiatives;
      if(typeof input.activeTokenId==="string")next.activeTokenId=input.activeTokenId;
      if(Object.hasOwn(input,"movementUsed"))next.movementUsed=input.movementUsed===true;
      if(input.reset===true){next.enabled=true;next.round=1;next.turnOrder=Array.isArray(input.turnOrder)?input.turnOrder:board.tokens.map((token)=>token.id);next.initiatives=input.initiatives&&typeof input.initiatives==="object"?input.initiatives:{};next.activeTokenId=next.turnOrder[0]||"";next.movementUsed=false;}
      board.combat=normalizeCombat(next,board.tokens);
      if(board.combat.activeTokenId!==current.activeTokenId){board.combat.movementUsed=false;transitionCombatConditions(board,current.activeTokenId,board.combat.activeTokenId);}
    }
    if(board.combat.enabled&&board.tokens.length>board.gridColumns*board.gridRows)return message(response,400,"A grade não tem células livres para todos os tokens do combate.");
    if(mediaChanged)bumpBoardMedia(party);
    saveDatabase();
    return respond(response,200,{board:publicBoard(party,true,true)});
  }
  if(parts.length===5&&parts[3]==="board"&&parts[4]==="tokens"&&request.method==="POST"){
    const body=await readJson(request);if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode adicionar tokens.");const input=body.token||{},linkedSheet=normalizeMonsterSheet(input.sheet);if(input.sheet&&!linkedSheet)return message(response,400,"A ficha vinculada é grande demais.");const board=normalizeBoard(party);if(board.combat.enabled&&board.tokens.length>=board.gridColumns*board.gridRows)return message(response,400,"A grade está cheia. Termine o combate ou aumente a grade antes de adicionar outro token.");const token={id:id("token"),name:cleanName(input.name,"Monstro"),kind:"monster",ownerMemberId:null,photo:imageData(input.photo),x:clamp(input.x??50,1,99),y:clamp(input.y??50,1,99),size:clamp(input.size??8,5,13),sheet:linkedSheet};board.tokens.push(token);bumpBoardMedia(party);saveDatabase();return respond(response,201,{board:publicBoard(party,true,true),token:{...token}});
  }
  if(parts.length===7&&parts[3]==="board"&&parts[4]==="tokens"&&parts[6]==="damage"&&request.method==="POST"){
    const body=await readJson(request);
    if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode aplicar dano direto.");
    const board=normalizeBoard(party),token=board.tokens.find((entry)=>entry.id===parts[5]);
    if(!token)return message(response,404,"Token não encontrado.");
    const sheet=tokenCharacter(party,token);
    if(!sheet)return message(response,400,"O token precisa de uma ficha vinculada para receber dano.");
    if(Math.round(clamp(body.rawDamage,0,100000))<=0)return message(response,400,"Informe um dano maior que zero.");
    const result=resolveIncomingDamage(sheet,body);
    setTokenCharacter(party,token,sheet);saveDatabase();
    return respond(response,200,{result,target:{id:token.id,name:token.name},board:publicBoard(party,true,true)});
  }
  if(parts.length===6&&parts[3]==="board"&&parts[4]==="tokens"&&request.method==="PUT"){
    const body=await readJson(request),board=normalizeBoard(party),token=board.tokens.find((entry)=>entry.id===parts[5]);
    if(!token)return message(response,404,"Token não encontrado.");
    if(isHost(party,body.hostKey)){
      const input=body.token||{};
      let mediaChanged=false;
      if(Object.hasOwn(input,"name"))token.name=cleanName(input.name,token.name);
      if(Object.hasOwn(input,"photo")){const photo=imageData(input.photo);if(input.photo&&!photo)return message(response,400,"A imagem do token é inválida ou grande demais.");if(token.photo!==photo){token.photo=photo;mediaChanged=true;}}
      if(token.kind==="monster"&&Object.hasOwn(input,"sheet")){const linkedSheet=normalizeMonsterSheet(input.sheet);if(input.sheet&&!linkedSheet)return message(response,400,"A ficha vinculada é grande demais.");token.sheet=linkedSheet;}
      if(Object.hasOwn(input,"x")||Object.hasOwn(input,"y")){
        const x=Object.hasOwn(input,"x")?input.x:token.x,y=Object.hasOwn(input,"y")?input.y:token.y;
        if(board.combat.enabled)moveCombatToken(party,board,token,x,y);else{token.x=clamp(x,1,99);token.y=clamp(y,1,99);}
      }
      if(Object.hasOwn(input,"size"))token.size=clamp(input.size,5,13);
      if(mediaChanged)bumpBoardMedia(party);
      saveDatabase();
      return respond(response,200,{board:publicBoard(party,true,true)});
    }
    const member=party.members.find((entry)=>entry.id===body.memberId);
    if(!isMember(member,body.memberKey)||token.ownerMemberId!==member.id)return message(response,401,"Você só pode mover o seu próprio token.");
    if(board.combat.enabled)moveCombatToken(party,board,token,body.x,body.y);else{token.x=clamp(body.x,1,99);token.y=clamp(body.y,1,99);}
    saveDatabase();
    return respond(response,200,{board:publicBoard(party,true)});
  }
  if(parts.length===6&&parts[3]==="board"&&parts[4]==="tokens"&&request.method==="DELETE"){
    const body=await readJson(request);if(!isHost(party,body.hostKey))return message(response,401,"Somente o Mestre pode remover tokens.");const board=normalizeBoard(party),index=board.tokens.findIndex((entry)=>entry.id===parts[5]);if(index<0)return message(response,404,"Token não encontrado.");if(board.tokens[index].kind!=="monster")return message(response,400,"Tokens de jogadores não podem ser excluídos da mesa.");board.tokens.splice(index,1);bumpBoardMedia(party);saveDatabase();return respond(response,200,{board:publicBoard(party,true,true)});
  }
  return message(response,404,"Rota não encontrada.");
}

const server=http.createServer(async(request,response)=>{const url=new URL(request.url,`http://${request.headers.host||"localhost"}`);try{if(url.pathname==="/health")return respond(response,200,{ok:true});if(url.pathname.startsWith("/api/"))return await handleApi(request,response,url);if(request.method!=="GET"&&request.method!=="HEAD")return message(response,405,"Método não permitido.");return serveStatic(request,response,url);}catch(error){console.error(error);return message(response,400,error.message||"Não foi possível concluir a solicitação.");}});
server.listen(PORT,()=>console.log(`Alicia Party disponível em http://localhost:${PORT}`));
