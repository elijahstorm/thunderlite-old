var Levels_Class = function()
{
	var unlocked_levels = 3;
	var LevelData = {
		Names:[],
		Players:[],
		Terrain:[],
		Start:function(Game, lvl){}
	};

	this.Draw = function(canvas, x, y, w, h, level)
	{
		console.error("dont call here");
		// var holder = new Engine_Class(level, true);
		// INTERFACE.Sample_Draw(canvas, x, y, w, h, holder);
		// holder.End_Game();
	};
	this.Terrain = {
		Draw:function(canvas, x, y, w, h, level){
			if(canvas==null||typeof canvas==="undefined")return;
			if(x==null)x = 0;
			if(y==null)y = 0;
			if(w==null)w = 100;
			if(h==null)h = 100;
			if(level==null)level = 0;
			var map = LevelData.Terrain[level];
			if(!map)return;
			var tileWidth = w/map.length;
			var tileHeight = h/map[0].length;
			for(var i=0;i<map.length;i++)
			for(var j=0;j<map[i].length;j++)
			{
				var img = Terrain_Data.TERRE[map[i][j]].Sprite[0];
				if(img.Image().height>TILESIZE)
				{
					var xtra_height = img.Image().height-TILESIZE;
					img.Draw(canvas,x+i*tileWidth,y+(((j-xtra_height/img.Image().height)*tileHeight)),tileWidth,tileHeight*(xtra_height/img.Image().height)+tileHeight);
					continue;
				}
				img.Draw(canvas,x+i*tileWidth,y+j*tileHeight,tileWidth,tileHeight);
			}
		},
		Data:function(num){
			return LevelData.Terrain[num];
		}
	};
	this.Names = function(num)
	{
		return LevelData.Names[num];
	};
	this.Players = function(num)
	{
		return LevelData.Players[num];
	};
	this.From_Name = function(name)
	{
		for(var i in LevelData.Names)
		{
			if(LevelData.Names[i]==name)
			{
				return i;
			}
		}
	}
	this.Units = function(num)
	{
		return LevelData.Units[num];
	};
	this.Rows = function(num)
	{
		return LevelData.Terrain[num].length;
	};
	this.Cols = function(num)
	{
		return LevelData.Terrain[num][0].length;
	};
	this.Run = function(Game, lvl)
	{
		if(!Levels.Unlocked(lvl))
			return;
		Game.Name = LevelData.Names[lvl];
		LevelData.Start(Game, lvl);
	};
	this.Play_Custom = function(Game, map_data)
	{
		if(!map_data.Valid)
			return;
		Game.Name = map_data.Name;
		Game.Map = map_data.Map;
		Game.id = map_data.id;
		return map_data.Start(Game);
	};
	this.Unlocked = function(num)
	{
		return (num<=unlocked_levels);
	};
	this.Current = function()
	{
		return unlocked_levels;
	};
	this.Length = function()
	{
		return LevelData.Terrain.length;
	};
	this.Next = function()
	{
		return ++unlocked_levels;
	}
};
var Levels = new Levels_Class();
