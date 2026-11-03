# Character animation

Playable heroes use the customizable humanoid rig in `js/character-art.js` for idle, movement, and attacks. It faces the direction of travel and uses each character's class, race, armor, and weapon. The game no longer loads class animation PNG sequences.

The supplied `rpg_character_animation_assets/full_sprite_atlas.png` remains the source reference for class appearance; its presentation-sheet frames are not used as game sprites. Mage has no sequence in the atlas, so the same animated rig handles Mage and every other class.
