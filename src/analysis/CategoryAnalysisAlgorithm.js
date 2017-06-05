/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function CategoryAnalysisAlgorithm(){
    if ( CategoryAnalysisAlgorithm.prototype._singletonInstance )
        return CategoryAnalysisAlgorithm.prototype._singletonInstance;
    CategoryAnalysisAlgorithm.prototype._singletonInstance = this;
}

CategoryAnalysisAlgorithm.prototype.getPopularityColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 24999) return 'green';
    if (salesRank < 60000) return 'yellow';
    return 'red';
};

CategoryAnalysisAlgorithm.prototype.getPotentialColor = function(avgMonthlyRevString){
    var avgMonthlyRev = parseInt(avgMonthlyRevString);
    if (avgMonthlyRev < 200) return 'red';
    if (avgMonthlyRev < 1000) return 'yellow';
    return 'green';
};

CategoryAnalysisAlgorithm.prototype.getCompetitionColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 4600) return 'red';
    if (salesRank < 14000) return 'yellow';
    return 'green';
};

CategoryAnalysisAlgorithm.prototype.setBullets = function(object){
    this.setPopularityBullet(object.salesRank20);
    this.setPotentialBullet(object.avgMonthlyRev);
    this.setCompetitionBullet(object.salesRank20);
};

CategoryAnalysisAlgorithm.prototype.setPopularityBullet = function(value){
    var popularityColor = this.getPopularityColor(value);
    var bullet = $('#bullet-1');
    bullet.removeClass().addClass('bullet-' + popularityColor);
    bullet.tooltipster('content', this.getPopularityTooltip(popularityColor));
};

CategoryAnalysisAlgorithm.prototype.setPotentialBullet = function(value){
    var potentialColor = this.getPotentialColor(value);
    var bullet = $('#bullet-2');
    bullet.removeClass().addClass('bullet-' + potentialColor);
    bullet.tooltipster('content', this.getPotentialTooltip(potentialColor));
};

CategoryAnalysisAlgorithm.prototype.setCompetitionBullet = function(value){
    var competitionColor = this.getCompetitionColor(value);
    var bullet = $('#bullet-3');
    bullet.removeClass().addClass('bullet-' + competitionColor);
    bullet.tooltipster('content', this.getCompetitionTooltip(competitionColor));
};

CategoryAnalysisAlgorithm.prototype.getPopularityTooltip = function(val){
    if(val == 'green') return 'This category is very popular and books here have good sales volumes.';
    if(val == 'yellow') return 'Caution: This category has a rather average popularity with mediocre sales volumes.';
    return 'Warning: This category is not very popular and sales volumes here are very low.';
};

CategoryAnalysisAlgorithm.prototype.getPotentialTooltip = function(val){
    if(val == 'green') return 'The revenue potential in this category is very good.';
    if(val == 'yellow') return 'Caution: The avg. monthly revenue of these books is rather mediocre.';
    return 'Warning: The avg. monthly revenue of books here is rather low.';
};

CategoryAnalysisAlgorithm.prototype.getCompetitionTooltip = function(val){
    if(val == 'green') return 'You can easily compete here for a first page category ranking.';
    if(val == 'yellow') return 'Caution: There is some healthy competition here.';
    return 'Warning: The competition here is very strong.';
};