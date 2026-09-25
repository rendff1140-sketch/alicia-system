# Alicia — Ficha de Fantasia Medieval

Aplicativo para criar fichas e realizar os cálculos do **Alicia Generic RPG System** com o **Módulo Fantasia Medieval**.

Abra `index.html` no navegador ou sirva a pasta localmente. A ficha é salva somente no `localStorage` do navegador; use **Exportar ficha** para fazer cópias ou transferi-la entre dispositivos.

O que está incluído:

- criação de personagem, atributos, trilhas e Pontos de Estado;
- foto local do personagem;
- aquisição de perícias, limites por atributo e bônus concedidos pelas trilhas;
- inventário, defesa, capacidade e cálculo de resistência a dano/efeitos;
- progressão, EXP e itens selecionados do módulo;
- exportação e importação de fichas em JSON.
- party online: Mestre cria a sala, envia um convite por link e visualiza as fichas compartilhadas; cada jogador escolhe uma ficha e enxerga somente a própria.

## Rodar localmente

Para usar apenas fichas locais, abra `index.html` no navegador. Para testar a party online, use Node 20 ou mais recente:

```powershell
npm start
```

Depois, abra `http://localhost:3000`. As parties ficam salvas em `data/parties.json`, que não é enviado ao Git.

## Publicar no Railway pelo GitHub

1. Crie um repositório GitHub e envie os arquivos desta pasta.
2. No Railway, crie um projeto e escolha **Deploy from GitHub Repo**; ele reconhece o projeto Node e executa `npm start`.
3. Em **Settings → Networking**, gere o domínio público.
4. Em **Volumes**, adicione um volume ao serviço com ponto de montagem `/data`.
5. Em **Variables**, crie `DATA_DIR=/data`.

O volume é obrigatório para manter as parties entre implantações e reinicializações. Não inclua a pasta `data/` no repositório: ela contém as fichas compartilhadas e as chaves de acesso da party.

Regras narrativas, efeitos de magias e partes marcadas como desatualizadas nos PDFs continuam sob decisão do Mestre e podem ser registradas nos campos manuais.
