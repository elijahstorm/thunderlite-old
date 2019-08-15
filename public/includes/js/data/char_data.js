var Char_Data = {
	CHARS:[],
	TypeToStr:["Ground","Air","Sea"],
	SortByType:[[],[],[]],
	AttackToStr:["Light","Medium","Heavy"],
	ArmorToStr:["Light","Medium","Heavy"],
	MoveToStr:["Foot","Wheel","Tank","Low Air","Medium Air","High Air","Surface Water","Submerged","Heavy Boat","Immoveable"],
	SortByMove:[[],[],[],[],[],[],[],[],[],[]],
	Resources:function(canvas, x, y, unit){
		if(unit.Cash==0)
			return;
		canvas.save();
		canvas.translate(x, y);
		INTERFACE.Resource_Draw(canvas, unit.Cash);
		canvas.restore();
	},
	Radar_Display:function(canvas, x, y){
		canvas.save();
		canvas.globalAlpha = .5;
		canvas.fillStyle = "#AAA";
		var __tilesize = TILESIZE;
		canvas.fillRect(x-__tilesize,y-__tilesize,__tilesize*3,__tilesize*3);
		canvas.fillRect(x-__tilesize*2,y,__tilesize,__tilesize);
		canvas.fillRect(x+__tilesize*2,y,__tilesize,__tilesize);
		canvas.fillRect(x,y-__tilesize*2,__tilesize,__tilesize);
		canvas.fillRect(x,y+__tilesize*2,__tilesize,__tilesize);
		canvas.globalAlpha = .8;
		canvas.strokeStyle = "#EEE";
		canvas.strokeWidth = 3;
		canvas.beginPath();
		canvas.moveTo(x-__tilesize,y-__tilesize);
		canvas.lineTo(x,y-__tilesize);
		canvas.lineTo(x,y-__tilesize*2);
		canvas.lineTo(x+__tilesize,y-__tilesize*2);
		canvas.lineTo(x+__tilesize,y-__tilesize);
		canvas.lineTo(x+__tilesize*2,y-__tilesize);
		canvas.lineTo(x+__tilesize*2,y);
		canvas.lineTo(x+__tilesize*3,y);
		canvas.lineTo(x+__tilesize*3,y+__tilesize);
		canvas.lineTo(x+__tilesize*2,y+__tilesize);
		canvas.lineTo(x+__tilesize*2,y+__tilesize*2);
		canvas.lineTo(x+__tilesize,y+__tilesize*2);
		canvas.lineTo(x+__tilesize,y+__tilesize*3);
		canvas.lineTo(x,y+__tilesize*3);
		canvas.lineTo(x,y+__tilesize*2);
		canvas.lineTo(x-__tilesize,y+__tilesize*2);
		canvas.lineTo(x-__tilesize,y+__tilesize);
		canvas.lineTo(x-__tilesize*2,y+__tilesize);
		canvas.lineTo(x-__tilesize*2,y);
		canvas.lineTo(x-__tilesize,y);
		canvas.lineTo(x-__tilesize,y-__tilesize);
		canvas.closePath();
		canvas.stroke();
		canvas.restore();
	},
	Get:function(check)
	{
		for(var i=1;i<Char_Data.CHARS.length;i++)
		{
			if(check==Char_Data.CHARS[i].Name)
			{
				return i;
			}
		}
		return 0;
	},
	Reverse_Get:function(index)
	{
		if(index<Char_Data.CHARS.length)
		return Char_Data.CHARS[index];
	}
};

// idea -> jammers should be stealthed

var COMMON_RANGE = [1,1];
var CURCHAR = 0;
var CURMODS = Mod_List.Units;
Char_Data.CHARS[CURCHAR++] = {	// index = 0
	Name:"ERROR",
	Description:"ERROR",
	Type:-1,
	Max_Health:0,
	Armor:-1,
	Power:0,
	Weapon:-1,
	Movement:0,
	Move_Type:-1,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:0,
	Cost:0,
	Actions:[],
	Actable:true,
	Modifiers:[],
	Sprite:[ERRORIMG,ERRORIMG,ERRORIMG],
	AttackSFX:null,
	MoveSFX:null,
	X:[0,0,0],
	Y:[0,0,0]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Strike Commando",
	Description:"Basic land unit",
	Type:0,
	Max_Health:40,
	Armor:0,
	Power:20,
	Weapon:0,
	Movement:3,
	Move_Type:0,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:2,
	Cost:75,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Start_Turn.Capture,CURMODS.Move.Tracking,CURMODS.Self_Action.Transport,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('machine gun'),
	MoveSFX:SFXs.Retrieve('footstep'),
	X:[20,20,20],
	Y:[13,13,13]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Heavy Commando",
	Description:"Basic land unit",
	Type:0,
	Max_Health:40,
	Armor:0,
	Power:35,
	Weapon:2,
	Movement:3,
	Move_Type:0,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:2,
	Cost:100,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Start_Turn.Capture,CURMODS.Move.Tracking,CURMODS.Self_Action.Transport,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:SFXs.Retrieve('footstep'),
	X:[14,20,20],
	Y:[13,13,13]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Jammer Truck",
	Description:"Stops air units from entering jammed area and uncloaks hidden units",
	Type:0,
	Max_Health:50,
	Armor:0,
	Power:0,
	Weapon:-1,
	Movement:5,
	Move_Type:1,
	Slow:false,
	Range:[], // enemies attacked will be partially disabled
	Sight:2,
	Cost:300,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Move.Radar,CURMODS.Idle.Jamming,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:null,
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[2,15,15],
	Y:[5,7,5]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Mortar Truck",
	Description:"Heavy distanced attack but with short range",
	Type:0,
	Max_Health:50,
	Armor:0,
	Power:48,
	Weapon:1,
	Movement:5,
	Move_Type:1,
	Slow:true,
	Range:[2,3],
	Sight:3,
	Cost:285,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Counter_Range,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[2,15,15],
	Y:[5,2,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Rocket Truck",
	Description:"Weaker distanced attack but with long range",
	Type:0,
	Max_Health:40,
	Armor:0,
	Power:40,
	Weapon:2,
	Movement:6,
	Move_Type:1,
	Slow:true,
	Range:[3,5],
	Sight:4,
	Cost:470,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Counter_Range,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[2,17,15],
	Y:[5,6,7]
};
Char_Data.CHARS[CURCHAR++] = {	// index = 6
	Name:"Flak Tank",
	Description:"Very effective against air units",
	Type:0,
	Max_Health:70,
	Armor:1,
	Power:17,
	Weapon:0,
	Movement:6,
	Move_Type:2,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:240,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Air_Raid,CURMODS.Damage.Flak,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('machine gun'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[7,12,12],
	Y:[5,4,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Scorpion Tank",
	Description:"Basic tank unit",
	Type:0,
	Max_Health:70,
	Armor:1,
	Power:35,
	Weapon:1,
	Movement:6,
	Move_Type:2,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:270,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Damage.Fast_Attack,CURMODS.Self_Action.Repairable,CURMODS.Can_Attack.Bombard],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[8,12,12],
	Y:[15,4,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Stealth Tank",
	Description:"Can hide itself",
	Type:0,
	Max_Health:40,
	Armor:1,
	Power:30,
	Weapon:0,
	Movement:5,
	Move_Type:2,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:340,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.End_Turn.Cloak,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[8,12,12],
	Y:[10,7,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Spider Tank",
	Description:"Can climb mountains",
	Type:0,
	Max_Health:40,
	Armor:1,
	Power:55,
	Weapon:1,
	Movement:4,
	Move_Type:0,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:250,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Attack.Stun,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:SFXs.Retrieve('footstep'),
	X:[9,12,12],
	Y:[11,7,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Lance Tank",
	Description:"Can hit space directly behind enemy",
	Type:0,
	Max_Health:70,
	Armor:1,
	Power:35,
	Weapon:1,
	Movement:6,
	Move_Type:2,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:270,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Attack.Lance,CURMODS.Self_Action.Repairable,CURMODS.Can_Attack.Bombard],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[5,12,12],
	Y:[10,4,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Annihilator Tank",
	Description:"Massive tank",
	Type:0,
	Max_Health:140,
	Armor:2,
	Power:70,
	Weapon:2,
	Movement:4,
	Move_Type:2,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:525,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Damage.Slow_Attack,CURMODS.Self_Action.Repairable,CURMODS.Can_Attack.Bombard],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[3,3,0],
	Y:[3,4,0]
};
Char_Data.CHARS[CURCHAR++] = {	// index = 12
	Name:"Warmachine",
	Description:"Creates other units",
	Type:0,
	Max_Health:75,
	Armor:1,
	Power:60,
	Weapon:2,
	Movement:3,
	Move_Type:2,
	Slow:true,
	Range:[2,3],
	Sight:3,
	Cost:525,
	Cash:2000,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Self_Action.Miner,CURMODS.Self_Action.Builder,CURMODS.Self_Action.Repairable,CURMODS.Death.Insta_Lose],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('car engine'),
	X:[2,0,0],
	Y:[-17,-17,-10]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Blockade",
	Description:"Cannot move or attack, but enemies cannot cross",
	Type:0,
	Max_Health:70,
	Armor:1,
	Power:0,
	Weapon:0,
	Movement:0,
	Move_Type:9,
	Slow:true,
	Range:[0,0],
	Sight:0,
	Cost:0,
	Actions:[],
	Actable:false,
	Modifiers:[CURMODS.Self_Action.Irreparable],
	Sprite:[],
	AttackSFX:null,
	MoveSFX:null,
	X:[3,3,3],
	Y:[5,5,5]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Turret",
	Description:"Basic turret unit",
	Type:0,
	Max_Health:100,
	Armor:1,
	Power:40,
	Weapon:1,
	Movement:0,
	Move_Type:9,
	Slow:true,
	Range:[2,5],
	Sight:5,
	Cost:0,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('gun shot'),
	MoveSFX:null,
	X:[6,4,4],
	Y:[4,5,5]
};

Char_Data.CHARS[CURCHAR++] = {	// index = 15
	Name:"Raptor Fighter",
	Description:"Basic air unit",
	Type:1,
	Max_Health:50,
	Armor:0,
	Power:25,
	Weapon:0,
	Movement:8,
	Move_Type:4,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:5,
	Cost:235,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Air_Raid,CURMODS.Self_Action.Irreparable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('machine gun'),
	MoveSFX:SFXs.Retrieve('jet'),
	X:[7,4,4],
	Y:[7,5,5]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Condor Bomber",
	Description:"Drops bombs of massive damage",
	Type:1,
	Max_Health:72,
	Armor:1,
	Power:70,
	Weapon:2,
	Movement:4,
	Move_Type:4,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:3,
	Cost:600,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Bombard],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('air'),
	X:[2,3,7],
	Y:[4,3,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Vulture Drone",
	Description:"Can move again if attack kills",
	Type:1,
	Max_Health:55,
	Armor:1,
	Power:30,
	Weapon:1,
	Movement:5,
	Move_Type:3,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:5,
	Cost:550,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.End_Turn.Vulture,CURMODS.Self_Action.Repairable,CURMODS.Can_Attack.Bombard],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('machine gun'),
	MoveSFX:SFXs.Retrieve('jet'),
	X:[7,6,7],
	Y:[10,7,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Transporter",
	Description:"Can transport a non-air unit through the air",
	Type:1,
	Max_Health:50,
	Armor:0,
	Power:0,
	Weapon:0,
	Movement:6,
	Move_Type:3,
	Slow:true,
	Range:[0,0],
	Sight:3,
	Cost:0,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Self_Action.Land,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:null,
	MoveSFX:SFXs.Retrieve('air'),
	X:[15,10,10],
	Y:[10,10,10]
};

Char_Data.CHARS[CURCHAR++] = {	// index = 19
	Name:"Intrepid",
	Description:"Can capture sea buildings",
	Type:2,
	Max_Health:50,
	Armor:0,
	Power:15,
	Weapon:0,
	Movement:6,
	Move_Type:6,
	Sight:5,
	Slow:false,
	Range:COMMON_RANGE,
	Cost:200,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Start_Turn.Capture,CURMODS.Move.Tracking,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('machine gun'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[3,15,15],
	Y:[7,10,10]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Hunter Support",
	Description:"Can attack air units",
	Type:2,
	Max_Health:90,
	Armor:1,
	Power:17,
	Weapon:0,
	Movement:5,
	Move_Type:6,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:4,
	Cost:450,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Air_Raid,CURMODS.Damage.Flak,CURMODS.Move.Tracking,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[0,12,12],
	Y:[2,7,7]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Corvette",
	Description:"Basic sea unit",
	Type:2,
	Max_Health:90,
	Armor:1,
	Power:45,
	Weapon:1,
	Movement:5,
	Move_Type:8,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:4,
	Cost:500,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Can_Attack.Ground_Assult,CURMODS.Damage.Fast_Attack],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[2,12,12],
	Y:[8,7,0]
};
Char_Data.CHARS[CURCHAR++] = {
	Name:"Battle Cruiser",
	Description:"Can attack from the farthest distance in the game",
	Type:2,
	Max_Health:140,
	Armor:2,
	Power:55,
	Weapon:2,
	Movement:4,
	Move_Type:8,
	Slow:true,
	Range:[2,6],
	Sight:6,
	Cost:800,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[0,0,0],
	Y:[0,0,0]
};
Char_Data.CHARS[CURCHAR++] = {	// index = 23
	Name:"U-Boat",
	Description:"Can hide underwater",
	Type:2,
	Max_Health:25,
	Armor:0,
	Power:35,
	Weapon:2,
	Movement:4,
	Move_Type:7,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:4,
	Cost:475,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.End_Turn.Cloak,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[3,20,20],
	Y:[10,10,7]
};
Char_Data.CHARS[CURCHAR++] = {	// index = 23
	Name:"Loading Boat",
	Description:"Can ship across water",
	Type:2,
	Max_Health:60,
	Armor:1,
	Power:0,
	Weapon:2,
	Movement:4,
	Move_Type:7,
	Slow:false,
	Range:COMMON_RANGE,
	Sight:2,
	Cost:0,
	Actions:[],
	Actable:true,
	Modifiers:[CURMODS.Self_Action.Land,,CURMODS.Self_Action.Repairable],
	Sprite:[],
	AttackSFX:SFXs.Retrieve('attack'),
	MoveSFX:SFXs.Retrieve('boat'),
	X:[3,20,20],
	Y:[10,10,7]
};

	/** Simple set for common data */
for(var x=1;x<Char_Data.CHARS.length;x++)
{
	var _c = Char_Data.CHARS[x];
		// setting sprites
	_c.Sprite[0] = Images.Declare("Units/"+_c.Name+".png",_c.Name);
	_c.Sprite[1] = Images.Declare("Units/up/"+_c.Name+".png",_c.Name+" Up");
	_c.Sprite[2] = Images.Declare("Units/down/"+_c.Name+".png",_c.Name+" Down");
	Char_Data.SortByType[_c.Type].push(x);
	Char_Data.SortByMove[_c.Move_Type].push(x);
	// if(_c.Modifiers.length>0)
	// {
		// writing descriptions
		// for(var i=1;i<_c.Modifiers.length;i++)
		// {
			// _c.Description+=_c.Modifiers[i].Name()+", ";
		// }
		// _c.Description+=_c.Modifiers[0].Name();
	// }
}
