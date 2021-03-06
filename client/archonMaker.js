import { fabric } from 'fabric';
import QRCode from 'qrcode';
import uuid from 'uuid';

export const buildDeckList = (deck, language, translate, AllCards) => new Promise(resolve => {
    const defaultCard = 'img/idbacks/identity.jpg';
    if(!deck.houses) {
        resolve(defaultCard);
        return;
    }

    if(!deck.cards || 0 >= deck.cards.length) {
        buildArchon(deck, language)
            .then(imageUrl => resolve(imageUrl))
            .catch(() => resolve(defaultCard));
        return;
    }

    const canvas = new fabric.Canvas('decklist');
    if(!canvas) {
        resolve(defaultCard);
        return;
    }

    canvas.setDimensions({ width: 600, height: 840 });
    const Common = loadImage('img/idbacks/Common.png');
    const Rare = loadImage('img/idbacks/Rare.png');
    const Special = loadImage('img/idbacks/Special.png');
    const Uncommon = loadImage('img/idbacks/Uncommon.png');
    const anomaly = loadImage('img/idbacks/Anomaly.png');
    const cardBack = loadImage('img/idbacks/decklist.png');
    const legacy = loadImage('img/idbacks/Legacy.png');
    const maverick = loadImage('img/idbacks/Maverick.png');
    const set = loadImage(`img/idbacks/${deck.expansion}.png`);
    const tco = loadImage('img/idbacks/tco.png');

    const houseData = {
        size: 35,
        0: { x: 55, y: 120 },
        1: { x: 55, y: 498 },
        2: { x: 310, y: 215 }
    };
    const cardData = {
        size: 20,
        start: { x: 60, y: 165 }
    };
    const qrCode = new Promise(qrRes => {
        QRCode.toDataURL(`https://www.keyforgegame.com/${deck.uuid ? 'deck-details/' + deck.uuid : ''}`, { margin: 0 })
            .then(url => loadImage(url).then(image => qrRes(image)));
    });
    const title = getCircularText(deck.name, 1600, 0);
    Promise.all([cardBack, maverick, legacy, anomaly, Common, Uncommon, Rare, Special, qrCode, set, title, tco])
        .then(([cardBack, maverick, legacy, anomaly, Common, Uncommon, Rare, Special, qrCode, set, title, tco]) => {
            const Rarities = { Common, Uncommon, Rare, Special };
            qrCode.set({ left: 332, top: 612 }).scaleToWidth(150);
            set.set({ left: 232, top: 92 }).scaleToWidth(20);
            title.set({ left: -500, top: 33 });
            tco.set({ left: 505, top: 769, angle: -90 }).scaleToWidth(30);
            canvas.add(cardBack)
                .add(qrCode)
                .add(set)
                .add(title)
                .add(tco);

            const houseProm = deck.houses.sort().map((house, index) => {
                return new Promise(houseRes => {
                    loadImage(`img/idbacks/houses/${house}.png`).then(img => {
                        img.set({
                            left: houseData[index].x,
                            top: houseData[index].y
                        })
                            .scaleToWidth(30)
                            .scaleToHeight(30)
                            .setShadow({ color: 'gray', offsetX: 10, offsetY: 10, blur: 3 });
                        const houseText = new fabric.Text(translate(house).replace(/^\w/, c => c.toUpperCase()), {
                            fontWeight: 800,
                            fontFamily: 'Keyforge',
                            textAlign: 'left',
                            fillStyle: 'black',
                            fontSize: 25
                        }).set({ left: houseData[index].x + 35, top: houseData[index].y + 5 });
                        canvas.add(houseText).add(img);
                        houseRes();
                    });
                });
            });
            let order = ['action', 'artifact', 'creature', 'upgrade'];
            let cardList = deck.cards.map(card => {
                return {
                    ...AllCards[card.id],
                    is_maverick: !!card.maverick,
                    is_legacy: !!card.legacy,
                    is_anomaly: !!card.anomaly,
                    house: card.house
                };
            })
                .sort((a, b) => +a.number - +b.number)
                .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
                .sort((a, b) => deck.houses.sort().indexOf(a.house) - deck.houses.sort().indexOf(b.house));
            const cardProm = cardList.map((card, index) => {
                return new Promise(cardRes => {
                    let x = cardData.start.x,
                        y = cardData.start.y + (index * 28);
                    const name = (card.locale && card.locale[language]) ? card.locale[language].name : card.name;
                    if(index > 11) {
                        y = y + 45;
                    }

                    if(index > 20) {
                        x = x + 245;
                        y = cardData.start.y + ((index - 22.5) * 28);
                    }

                    if(index > 23) {
                        y = y + 52;
                    }

                    const fontProps = {
                        fontWeight: 800,
                        fontFamily: 'Keyforge',
                        textAlign: 'left',
                        fillStyle: 'black',
                        fontSize: 20
                    };
                    const rarity = new fabric.Image(Rarities[card.rarity === 'FIXED' || card.rarity === 'Variant' ? 'Special' : card.rarity].getElement())
                        .set({ left: x, top: y })
                        .scaleToWidth(cardData.size)
                        .setShadow({ color: 'gray', offsetX: 10, offsetY: 10, blur: 3 });
                    const number = new fabric.Text(card.number.toString(), fontProps).set({ left: x + 22, top: y });
                    const title = new fabric.Text(name, {
                        ...fontProps,
                        fontWeight: 300
                    }).set({ left: x + 60, top: y });
                    canvas.add(number).add(rarity).add(title);

                    let iconX = x + (name.length * 6) + 100;

                    if(card.is_maverick) {
                        iconX = iconX + 20;
                        const maverickImage = new fabric.Image(maverick.getElement())
                            .set({ left: iconX, top: y })
                            .setShadow({ color: 'gray', offsetX: 10, offsetY: 10, blur: 5 })
                            .scaleToHeight(cardData.size);
                        canvas.add(maverickImage);
                    }

                    if(card.is_legacy) {
                        const legacyImage = new fabric.Image(legacy.getElement())
                            .set({ left: iconX, top: y })
                            .setShadow({ color: 'gray', offsetX: 10, offsetY: 10, blur: 5 })
                            .scaleToWidth(cardData.size);
                        canvas.add(legacyImage);
                    }

                    if(card.is_anomaly) {
                        const anomalyImage = new fabric.Image(anomaly.getElement())
                            .set({ left: iconX, top: y })
                            .setShadow({ color: 'gray', offsetX: 10, offsetY: 10, blur: 5 })
                            .scaleToWidth(cardData.size);
                        canvas.add(anomalyImage);
                    }

                    cardRes();
                });
            });

            Promise.all([...houseProm, ...cardProm])
                .then(() => resolve(canvas.toDataURL('image/jpeg')))
                .catch(() => resolve(defaultCard));
        })
        .catch(() => resolve(defaultCard));
});

export const buildArchon = (deck, language) => new Promise(resolve => {
    if(!deck.houses) {
        resolve('img/idbacks/identity.jpg');
        return;
    }

    const canvas = new fabric.Canvas('archon');
    if(!canvas) {
        resolve('img/idbacks/identity.jpg');
        return;
    }

    canvas.setDimensions({ width: 600, height: 840 });
    const archon = loadImage(`/img/idbacks/archons/${imageName(deck, language)}.png`);
    const title = getCircularText(deck.name, 700, 0);
    Promise.all([archon, title])
        .then(([archon, title]) => {
            canvas.add(archon);
            title.set({ left: -50, top: 66 });
            canvas.add(title);
            resolve(canvas.toDataURL({ format: 'jpeg', quality: 0.8 }));
        })
        .catch(() => resolve('img/idbacks/identity.jpg'));
});

const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        fabric.Image.fromURL(url, image => {
            if(!image.getElement()) {
                reject();
            } else {
                resolve(image);
            }
        });
    });
};

const imageName = (deck, language) => {
    let number = btoa(deck.uuid || uuid.v1())
        .replace(/[\D+089]/g, '')
        .slice(-1);
    return btoa([...deck.houses.sort(), language, number === '' ? 1 : number].join());
};

const getCurvedFontSize = (length) => {
    const size = (30 / length) * 30;
    if(size > 30) {
        return 40;
    }

    return size;
};

const getCircularText = (text = '', diameter, kerning) => {
    return new Promise((resolve, reject) => {
        let canvas = fabric.util.createCanvasElement();
        if(!canvas) {
            reject();
            return;
        }

        let ctx = canvas.getContext('2d');
        let textHeight = 40, startAngle = 0;

        canvas.width = diameter;
        canvas.height = diameter;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'grey';
        ctx.shadowColor = 'rgb(32,32,32)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 3;
        ctx.font = `bold ${getCurvedFontSize(text.length)}px Keyforge`;

        text = text.split('').reverse().join('');

        ctx.translate(diameter / 2, diameter / 2); // Move to center
        ctx.textBaseline = 'middle'; // Ensure we draw in exact center
        ctx.textAlign = 'center'; // Ensure we draw in exact center

        for(let j = 0; j < text.length; j++) {
            let charWid = ctx.measureText(text[j]).width;
            startAngle += ((charWid + (j === text.length - 1 ? 0 : kerning)) / (diameter / 2 - textHeight)) / 2;
        }

        ctx.rotate(startAngle);

        for(let j = 0; j < text.length; j++) {
            let charWid = ctx.measureText(text[j]).width; // half letter
            ctx.rotate((charWid / 2) / (diameter / 2 - textHeight) * -1);
            ctx.fillText(text[j], 0, (0 - diameter / 2 + textHeight / 2));
            ctx.rotate((charWid / 2 + kerning) / (diameter / 2 - textHeight) * -1); // rotate half letter
        }

        loadImage(canvas.toDataURL()).then(resolve).catch(reject);
    });
};
