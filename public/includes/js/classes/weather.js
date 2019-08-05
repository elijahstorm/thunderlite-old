var Weather = function(name)
{
	let sheetAni = Animations.Retrieve(name),
		particleAni = Animations.Retrieve(name+" Droplets");
	this.Move_Cost = function(unit, tile)
	{	// calculate the move cost change for this tile

	};
	this.Affect = function(game)
	{	// run thru all units and affect them

	};
	this.Start = function()
	{
		sheetAni.Stop = false;
		particleAni.Stop = false;
	};
	this.Stop = function()
	{
		sheetAni.Stop = true;
		particleAni.Stop = true;
		weatherCanvas.clearRect(0, 0, TILESIZE, TILESIZE);
	};
};
