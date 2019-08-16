// Songs.Declare("Cake", "Cake", false);
// Songs.Declare("ChaiTea", "Chai Tea", false);
// Songs.Declare("HempAndOatmeal", "Hemp and Oatmeal", false);
// Songs.Declare("PBaJ", "PB&J", false);
// Songs.Declare("Saltines", "Saltines", false);
// Songs.Declare("story1", "Banana Bread", false);

// Declare(file, name, buffer, loop, autoplay)

SFXs.Declare("movement/air", "air", true, true);
SFXs.Declare("movement/boat", "boat", true, true);
SFXs.Declare("movement/jet", "jet", true, true);
SFXs.Declare("movement/footstep", "footstep", true, true);
SFXs.Declare("movement/carSus", "car engine", true, true);
// SFXs.Declare("movement/helicopter", "helicopter", true, true);
// SFXs.Declare("movement/horse", "horse", true, true);
// SFXs.Declare("movement/train", "train", true, true);
// SFXs.Declare("movement/carStart", "car start", true, false);
SFXs.Declare("build", "build", true, false);
SFXs.Declare("attack", "attack", true, false);
SFXs.Declare("explosion", "explosion", true, false);
SFXs.Declare("machineGun", "machine gun", true, true);
SFXs.Declare("gun", "gun shot", true, false);

SFXs.Declare("map editor/placement sheet", "editor sheet", true, false, .3, function(self){
  self.Break_By(8);
});
