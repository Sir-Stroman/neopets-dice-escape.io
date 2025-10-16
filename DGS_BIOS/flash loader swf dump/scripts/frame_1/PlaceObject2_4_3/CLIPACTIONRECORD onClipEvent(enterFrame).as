onClipEvent(enterFrame){
   if(++this.framecount == 1)
   {
      this.stime = getTimer();
   }
   else if(this.framecount > this.framedelay)
   {
      this.framecount = 0;
      this.samplecount = this.samplecount + 1;
      this.total_real_framerate += int(1000 / ((getTimer() - this.stime) / this.framedelay));
      _parent.objMain.average_real_framerate = int(this.total_real_framerate / this.samplecount);
   }
}
