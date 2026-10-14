# Crônicas do Abismo — versão web organizada

## Estrutura

```text
cronicas_do_abismo_web_organized/
├── index.html
├── assets/
│   └── README.txt
├── css/
│   └── style.css
└── js/
    ├── game.js
    └── vendor/
        └── three.min.js
```

## Como testar

1. Copie as imagens listadas em `assets/README.txt` para a pasta `assets`.
2. Dê dois cliques em `index.html`.
3. Para desenvolvimento, uma opção melhor é abrir a pasta no VS Code e usar a extensão **Live Server**; depois clique em **Go Live**.

## Organização

- `index.html`: somente estrutura da interface.
- `css/style.css`: aparência e layout responsivo.
- `js/game.js`: regras, criação do personagem, combate, loja, inventário e renderização 3D do jogo.
- `js/vendor/three.min.js`: biblioteca Three.js local para manter o projeto funcionando offline.
- `assets/`: única pasta usada para imagens do jogo.

Os modelos de armas que já estavam embutidos no JavaScript continuam embutidos, pois são geometria/dados 3D, não imagens externas.
