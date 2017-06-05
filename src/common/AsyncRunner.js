/**
 * Created by Andrey Klochkov on 01.04.15.
 */

// AsyncRunner class
function AsyncRunner() {
    this.itemsInProgress = 0;
    this.finished = function(){};
    this.itemFinished = function(){};
}

AsyncRunner.prototype.start = function(worker){
    var _this = this;
    _this.itemsInProgress++;
    worker(function(){
        _this.itemsInProgress--;
        _this.itemFinished();
        if(_this.itemsInProgress == 0) {
            _this.finished();
        }
    });
};
