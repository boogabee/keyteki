const Card = require('../../Card.js');

class NeutronShark extends Card {
    setupCardAbilities(ability) {
        this.play({
            fight: true,
            reap: true,
            targets: {
                enemy: {
                    cardType: ['creature', 'artifact'],
                    controller: 'opponent',
                    gameAction: ability.actions.destroy()
                },
                friendly: {
                    cardType: ['creature', 'artifact'],
                    controller: 'self',
                    gameAction: ability.actions.destroy()
                }
            },
            effect: 'destroy {1}',
            effectArgs: context => [Object.values(context.targets)],
            then: context => ({
                alwaysTriggers: true,
                condition: context => context.player.deck.length > 0,
                message: '{0} discards the top card of their deck due to {1}: {3}{4}{5}{6}',
                messageArgs: () => {
                    let topCard = context.player.deck[0];
                    if(topCard) {
                        if(topCard.hasHouse('logos')) {
                            return [topCard];
                        } else {
                            return [topCard, '. ', context.source, '\'s ability resolves again'];
                        }
                    }
                    return [];
                },
                gameAction: [
                    ability.actions.discard({
                        target: context.player.deck.length > 0 ? context.player.deck[0] : []
                    }),
                    ability.actions.resolveAbility({
                        target: context.player.deck.length && !context.player.deck[0].hasHouse('logos') ? context.source : [],
                        ability: context.ability
                    })
                ]
            })
        });
    }
}

NeutronShark.id = 'neutron-shark'; // This is a guess at what the id might be - please check it!!!

module.exports = NeutronShark;