/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function SearchAnalysisAlgorithm(){
    if ( SearchAnalysisAlgorithm.prototype._singletonInstance )
        return SearchAnalysisAlgorithm.prototype._singletonInstance;
    SearchAnalysisAlgorithm.prototype._singletonInstance = this;
}

SearchAnalysisAlgorithm.prototype.getPopularityColor = function(salesRankConclusionValue){
    var salesRankConclusion = parseInt(salesRankConclusionValue);
    if (salesRankConclusion < 3) return 'red';
    if (salesRankConclusion < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.getPotentialColor = function(monthlyRevBook){
    if (monthlyRevBook < 3) return 'red';
    if (monthlyRevBook < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.getCompetitionColor = function(totalResults){
    if (totalResults < 500) return 'green';
    if (totalResults < 1500) return 'yellow';
    return 'red';
};

SearchAnalysisAlgorithm.prototype.setBullets = function(object){
    this.setPopularityBullet(object.salesRankConclusionValue);
    this.setPotentialBullet(object.monthlyRevBook);
    this.setCompetitionBullet();
};

SearchAnalysisAlgorithm.prototype.setPopularityBullet = function(value){
    var popularityColor = this.getPopularityColor(value);
    var bullet = $('#bullet-1');
    bullet.removeClass().addClass('bullet-' + popularityColor);
    bullet.tooltipster('content', this.getPopularityTooltip(popularityColor));
};

SearchAnalysisAlgorithm.prototype.setPotentialBullet = function(value){
    var potentialColor = this.getPotentialColor(value);
    var bullet = $('#bullet-2');
    bullet.removeClass().addClass('bullet-' + potentialColor);
    bullet.tooltipster('content', this.getPotentialTooltip(potentialColor));
};

SearchAnalysisAlgorithm.prototype.setCompetitionBullet = function(){
    var _this = this;
    Api.sendMessageToActiveTab({type: "get-totalResults"}, function(totalResults){
        var competitionColor =  _this.getCompetitionColor(parseInt(totalResults));
        var bullet = $('#bullet-3');
        bullet.removeClass().addClass('bullet-' + competitionColor);
        bullet.tooltipster('content', _this.getCompetitionTooltip(competitionColor));
    });
};

SearchAnalysisAlgorithm.prototype.getPopularityTooltip = function(val){
    if(val == 'green') return 'This is a popular keyword and there are a number of books here performing well.';
    if(val == 'yellow') return 'Caution: There are only a small number of books performing well for this keyword.';
    return 'Warning: This keyword is not very popular.';
};

SearchAnalysisAlgorithm.prototype.getPotentialTooltip = function(val){
    if(val == 'green') return 'The revenue potential of books under this keyword looks very good.';
    if(val == 'yellow') return 'Caution: The revenue potential of books under this keyword looks a little average.';
    return 'Warning: The revenue potential of books under this keyword is rather low.';
};

SearchAnalysisAlgorithm.prototype.getCompetitionTooltip = function(val){
    if(val == 'green') return 'You can easily compete here for a first page ranking.';
    if(val == 'yellow') return 'Caution: There is some healthy competition here.';
    return 'Warning: The competition here is very strong.';
};