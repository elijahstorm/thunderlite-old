/// Code written and created by Elijah Storm
// Copywrite April 5, 2020
// for use only in ThunderLite Project


var TILESIZE = window.parent.mobilecheck() ? 50 : 60;

var Converter = {
	Screen:{
		X:function(input)
		{
			return input*TILESIZE;
		},
		Y:function(input)
		{
			return input*TILESIZE;
		}
	},
	Map:{
		X:function(input)
		{
			return Math.floor((input)/TILESIZE);
		},
		Y:function(input)
		{
			return Math.floor((input)/TILESIZE);
		}
	}
};

function Tile_Holder(x_len, y_len, func)
{
	var _range = Images.Retrieve("tile range attack").Image();
	var _walk = Images.Retrieve("tile walk").Image();
	var _attack = Images.Retrieve("tile attack").Image();
	var _danger = Images.Retrieve("tile danger").Image();
	function Tile_Class(x, y, action)
	{
		var name = "Tile("+x+","+y+")";
		var state = 0;
		this.Draw = function(canvas, x, y, w, h)
		{
			if(canvas==null)return;
			canvas.globalAlpha = .85;
			if(state==1){
				canvas.drawImage(_walk, x+15, y+15, w-30, h-30);
				Shape.Box.Draw(canvas, x, y, w, h, "#82D173");
				canvas.globalAlpha = .3;
				canvas.fillStyle = "#82D173";
				canvas.fillRect(x,y,w,h);
			}else if(state==2){
				canvas.drawImage(_attack, x, y, w, h);
				Shape.Box.Draw(canvas, x, y, w, h, "#7B2D26");
				canvas.globalAlpha = .3;
				canvas.fillStyle = "#7B2D26";
				canvas.fillRect(x,y,w,h);
			}else if(state==3){
				canvas.drawImage(_range, x, y, w, h);
				canvas.drawImage(_walk, x+15, y+15, w-30, h-30);
				Shape.Box.Draw(canvas, x, y, w, h, "#C35244");
				canvas.globalAlpha = .3;
				canvas.fillStyle = "#00F";
				canvas.fillRect(x,y,w,h);
			}else if(state==4){
				canvas.drawImage(_danger, x, y, w, h);
				Shape.Box.Draw(canvas, x, y, w, h, "#C35244");
				canvas.globalAlpha = .3;
				canvas.fillStyle = "#C35244";
				canvas.fillRect(x,y,w,h);
			}
		}
		this.Name = function(){return name;}
		this.X = function(){return x;}
		this.Y = function(){return y;}

		this.Action = action;

		this.Set = function(x)
		{
			state = x;
		};
		this.Blank = function()
		{
			state = 0;
		};
		this.Move = function()
		{
			state = 1;
		};
		this.Attack = function()
		{
			state = 2;
		};
		this.Both = function()
		{
			state = 3;
		};
	}
	this.Interface = null;
	var Tiles = [x_len];
	for(var x=0;x<x_len;x++)
	{
		Tiles[x] = [y_len];
		for(var y=0;y<y_len;y++)
		{
			Tiles[x][y] = new Tile_Class(x, y, func);
		}
	}

	this.Click = function(x, y)
	{
		if(x>=0&&y>=0)if(x<x_len&&y<y_len)
			Tiles[x][y].Action(this.Interface,x,y);
	};
	this.At = function(x, y)
	{
		if(x>=0&&y>=0)if(x<x_len&&y<y_len)
			return Tiles[x][y];
		return null;
	};
	this.Draw = function(canvas)
	{
		for(var x=0;x<x_len;x++)
		for(var y=0;y<y_len;y++)
		{
			Tiles[i].Draw(canvas, x*TILESIZE, y*TILESIZE, TILESIZE, TILESIZE);
		}
	};
};

var Map_Holder = function(map)
{
	if(map==null)return Levels.Blank;
	var rows = map.length;
	var cols = map[0].length;

	this.Clone = function()
	{
		var n_m = new Array(rows);
		for(var x=0;x<rows;x++)
		{
			n_m[x] = new Array(cols);
			for(var y=0;y<cols;y++)
			{
				if(map[x][y].Clone)
				{
					n_m[x][y] = map[x][y].Clone();
					continue;
				}
				n_m[x][y] = map[x][y];
			}
		}
		return new Map_Holder(n_m);
	};

	this.Width = rows;
	this.Height = cols;
	this.In_X_Range = function(check)
	{
		if(check<0)
			return false;
		if(check>=rows)
			return false;
		return true;
	};
	this.In_Y_Range = function(check)
	{
		if(check<0)
			return false;
		if(check>=cols)
			return false;
		return true;
	};
	this.In_Range = function(x,y)
	{
		if(x==null||y==null)return false;
		if(x==NaN||y==NaN)return false;
		return this.In_X_Range(x)&&this.In_Y_Range(y);
	};
	this.Set = function(x,y,value)
	{
		if(this.In_Range(x,y))
		{
			map[x][y] = value;
		}
	}
	this.At = function(x,y)
	{
		if(this.In_Range(x,y))
			return map[x][y];
		return null;
	};
	this.Wipe = function()
	{
		for(var x=0;x<rows;x++)
		for(var y=0;y<cols;y++)
		{
			map[x][y] = null;
		}
	};
	this.toString = function()
	{
		var str = "";
		for(var x=0;x<rows;x++)
		{
			for(var y=0;y<cols;y++)
			{
				str+=map[x][y]+", ";
			}
			str+="\b\b\n";
		}
		return str+"\b";
	}
};

function Blank_Map(x_len, y_len)
{
	var map = [x_len];
	for(var x=0;x<x_len;x++)
	{
		map[x] = [y_len];
		for(var y=0;y<y_len;y++)
		{
			map[x][y] = null;
		}
	}
	return map;
}

function Clone_Map(oldmap)
{
	var newmap = [oldmap.length];
	for(var x=0;x<oldmap.length;x++)
	{
		newmap[x] = [oldmap[x].length];
		for(var y=0;y<oldmap[x].length;y++)
		{
			newmap[x][y] = oldmap[x][y];
		}
	}
	return newmap;
}
