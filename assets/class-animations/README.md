# Playable class animation frames

Each class has eight PNG frames in `idle/`, `run/`, and `attack/`. PNGs have transparent backgrounds and are loaded by `js/class-sprite-animations.js`.

- Warrior, Ninja, Archer, Assassin, Druid, and Paladin frames were cut from the supplied Nine-Class Fantasy Sprite Sheet Atlas.
- Samurai, Tank, Necromancer, and Berserker frames came from `rpg_character_animation_assets`.
- Mage frames were derived from the supplied Mage front cutout because the animation asset folder did not include a Mage sequence.

Some atlas attack cells contain only the spell or impact effect. The animation map holds the previous character pose in those cells so the hero stays visible through the attack.
