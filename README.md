# Crônicas do Abismo — Mundo Infinito (expansão)

## Como jogar

**Mais simples:** abra `cronicas_abismo_jogar.html` em um navegador moderno.

**Para integrar ao seu projeto:** mantenha `open-world.html`, `css/open-world.css` e `js/open-world.js` com esta estrutura de pastas. O arquivo HTML preserva o link `index.html` para o jogo principal.

## Controles
- WASD/setas: mover; clique esquerdo/Espaço/J: atacar; Ninja: clique direito desfere golpe de katana; Tanke: segure o botão direito ou B para bloquear. O bloqueio é exclusivo do Tanke: todo o dano é convertido em consumo de mana; sem mana, o bloqueio se desfaz.
- Q: habilidade; R: ultimate; Shift: esquivar; H: usar poção; E: falar com NPC próximo; T: ligar/desligar ataque automático; P: pausa.
- Botão ☺: personalizar personagem; botões e joystick para telas de toque.

## Sistemas adicionados
- Mundo procedural ilimitado por chunks determinísticos, com biomas, acampamentos, altares e viajantes.
- Progressão de dificuldade a cada 38 segundos: inimigos têm mais vida, ataque, velocidade, frequência e elite.
- Novos monstros: aranhas, espectros, cultistas, guardiões, xamãs, harpias e mímicos. IA local de flanqueamento, recuo, perseguição e cura. Falas contextuais aparecem no mapa.
- Elementos: fogo queima, gelo reduz movimento/congela, raio atordoa e encadeia, natureza envenena, arcano torna vulnerável. Inimigos possuem resistências e fraquezas. Monstros podem aplicar debuffs ao herói.
- Gemas azuis de experiência coletáveis, moedas, poções e aprimoramentos aleatórios por nível.
- NPCs com funções de curandeiro, mercador, bardo, ferreiro e explorador; serviços custam moedas.
- Recrute até três seguidores de combate, incluindo novos aliados guardiões e arcanistas, por 120 moedas cada. Batedores e arcanistas atacam à distância; curandeiros apoiam o grupo.
- Novos gigantes glaciais se juntam ao Yeti Colossal e ao Ciclope nas regiões frias e distantes.
- Cada classe recebe um conjunto inicial de armadura e aparência próprios. O Assassino começa com capuz, couro escuro, capa carmesim e a Lâmina Oculta, que também pode ser selecionada como arma.
- Novas raças Tiefling e Minotauro, mais cabelos, emblemas, formatos do corpo, cicatrizes e cores de acabamento. Movimento suavizado.
- Save automático local preserva o progresso anterior e novas melhorias.

## Observações
- As falas de inimigos e NPCs são IA comportamental local, com diálogos contextuais pré-escritos; **não** há integração com LLM/API externa.
- As imagens opcionais de `assets/` mencionadas no projeto original não estavam entre os 3 arquivos enviados. As arenas já têm renderização alternativa em canvas; para recuperar imagens personalizadas antigas, adicione sua pasta `assets` original ao lado de `open-world.html`.
- O mundo gera regiões sob demanda e descarta chunks distantes para controlar a memória; dungeons e missões originais continuam delimitadas.
