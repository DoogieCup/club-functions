(function(){

    module.exports = function(log){
        this.log = log;

        return createEvents;
    }

    function createEvent(entityId, name, event, version){
        this.log(`Creating event: ${name} ${JSON.stringify(event)} Version ${version}`);
        var newEvent = {};

        var finalVersion = ('0000000000' + String(version)).slice(-10);

        newEvent.payload = {_: JSON.stringify(event)};
        newEvent.PartitionKey = {_: entityId};
        newEvent.eventType = {_: name};
        newEvent.RowKey = {_: finalVersion};
        this.log('Done');
        return newEvent;
    }

    function createEvents(entityId, events)
    {
        var version = 1;
        var returns = [];
        this.log(`Events ${JSON.stringify(events)}`);
        events.forEach(function(event) {
             returns.push(createEvent(String(entityId), event.name, event.event, version++));
        }, this);

        return returns;
    }
})();