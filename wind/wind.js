var colin = colin || {};

(function () {
    "use strict";

    fluid.registerNamespace("colin.ugen");

    colin.ugen.video = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        that.video = $(that.options.video)[0];

        that.gen = function (numSamps) {
            var start = that.inputs.start.output[0],
                end = that.inputs.end.output[0],
                loop = that.inputs.loop.output[0],
                rate = that.inputs.playbackRate.output[0];

            if (start !== that.model.start || end !== that.model.end) {
                var url = that.video.src;
                var hashIdx = url.lastIndexOf("#");
                if (hashIdx > -1) {
                    url = url.substring(0, hashIdx);
                }
                that.video.src = url + "#t=" + that.inputs.start.output[0] + "," + that.inputs.end.output[0];
                that.model.start = start;
                that.model.end = end;
            }

            if (loop !== that.model.loop) {
                that.video.loop = true;
                that.model.loop = loop;
            }

            that.video.playbackRate = rate;
        };

        return that;
    };

    fluid.defaults("colin.ugen.video", {
        rate: "control",
        inputs: {
            playbackRate: 1.0,
            loop: 0.0,
            start: 0,
            end: Infinity
        },
        ugenOptions: {
            video: "video",
            model: {}
        }
    });


    colin.ugen.renderTextArray = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        that.array = that.options.array;
        that.container = $(that.options.container);

        that.gen = function (numSamps) {
            var m = that.model,
                source = that.inputs.source.output[0],
                freq = that.inputs.freq.output[0],
                idx = source * that.array.length,
                item = that.array[Math.floor(idx)];

            if (freq !== m.freq) {
                m.freq = freq;
                m.sampsPerPeriod = m.sampleRate / freq;
                m.remainingSamps = m.sampsPerPeriod;
            }

            m.remainingSamps -= numSamps;
            if (m.remainingSamps <= 0) {
                m.remainingSamps = m.sampsPerPeriod;
                that.container.text(item);
            }

            that.output[0] = source;
        };

        that.container.text(that.array[0]);
        return that;
    };

    fluid.defaults("colin.ugen.renderTextArray", {
        rate: "control",
        inputs: {
            freq: 1/5
        },
        ugenOptions: {
            container: "#textArrayContainer",
            model: {
                remainingSamps: 0
            }
        }
    });


    colin.wind = function () {
        var synth = flock.synth({
            synthDef: colin.wind.synthDef
        });
        synth.play();
        var video = synth.get("video").video;
        video.addEventListener("play", function (e) {
            var flash = synth.get("audioInput").mike.domElement;
            $(flash).css({
                "height": "1px",
                "width": "1px"
            });
        });

    };

    colin.wind.cantoI = [
        "And then went down to the ship",
        "Set keel to breakers",
        "forth on the godly sea",
        "and We set up mast and sail on that swart ship",
        "Bore sheep aboard her",
        "and our bodies also Heavy with weeping",
        "so winds from sternward Bore us out onward with bellying canvas",
        "Circe's this craft",
        "the trim-coifed goddess. Then sat we amidships",
        "wind jamming the tiller",
        "Thus with stretched sail",
        "we went over sea till day's end. Sun to his slumber",
        "shadows o'er all the ocean",
        "Came we then to the bounds of deepest water",
        "To the Kimmerian lands",
        "and peopled cities Covered with close-webbed mist",
        "unpierced ever With glitter of sun-rays Nor with stars stretched",
        "nor looking back from heaven Swartest night stretched over wretched men there. The ocean flowing backward",
        "came we then to the place Aforesaid by Circe. Here did they rites",
        "Perimedes and Eurylochus",
        "And drawing sword from my hip I dug the ell-square pitkin; Poured we libations unto each the dead",
        "First mead and then sweet wine",
        "water mixed with white flour. Then prayed I many a prayer to the sickly death's-head; As set in Ithaca",
        "sterile bulls of the best For sacrifice",
        "heaping the pyre with goods",
        "A sheep to Tiresias only",
        "black and a bell-sheep. Dark blood flowed in the fosse",
        "Souls out of Erebus",
        "cadaverous dead",
        "of brides Of youths and at the old who had borne much; Souls stained with recent tears",
        "girls tender",
        "Men many",
        "mauled with bronze lance heads",
        "Battle spoil",
        "bearing yet dreory arms",
        "These many crowded about me; with shouting",
        "Pallor upon me",
        "cried to my men for more beasts; Slaughtered the heards",
        "sheep slain of bronze; Poured ointment, cried to the gods",
        "To Pluto the strong",
        "and praised Proserpine; Unsheathed the narrow sword",
        "I sat to keep off the impetuous impotent dead",
        "Till I should hear Tiresias. But first Elpenor came",
        "our friend Elpenor",
        "Unburied, cast on the wide earth",
        "Limbs that we left in the house of Circe",
        "Unwept",
        "unwrapped in sepulchre",
        "since toils urged other. Pitiful spirit. And I cried in hurried speech: \"Elpenor",
        "how art thou come to this dark coast? Cam'st thou afoot, outstripping seamen?\" And he in heavy speech: \"Ill fate and abundant wine. I slept in Circe's ingle. Going down the long ladder unguarded",
        "I fell against the buttress",
        "Shattered the nape-nerve",
        "the soul sought Avernus. But thou",
        "O King",
        "I bid remember me",
        "unwept",
        "unburied",
        "Heap up mine arms",
        "be tomb by sea-bord",
        "and inscribed: A man of no fortune",
        "and with a name to come. And set my oar up",
        "that I swung mid fellows.\" And Anticlea came",
        "whom I beat off",
        "and then Tiresias Theban",
        "Holding his golden wand",
        "knew me",
        "and spoke first: \"A second time? why? man of ill star",
        "Facing the sunless dead and this joyless region? Stand from the fosse",
        "leave me my bloody bever For soothsay.\" And I stepped back",
        "And he stong with the blood",
        "said then: \"Odysseus Shalt return through spiteful Neptune",
        "over dark seas",
        "Lose all companions.\" And then Anticlea came. Lie quiet Divus. I mean",
        "that is Andreas Divus",
        "In officina Wecheli",
        "1538",
        "out of Homer. And he sailed",
        "by Sirens and thence outward and away And unto Circe. Venerandam",
        "In the Creatan's phrase",
        "with the golden crown",
        "Aphrodite",
        "Cypri munimenta sortita est",
        "mirthful",
        "orichalchi",
        "with golden Girdles and breast bands",
        "thou with dark eyelids Bearing the golden bough of Argicida. So that:"
    ];

    colin.wind.synthDef = {
        ugen: "colin.ugen.video",
        id: "video",
        playbackRate: {
            ugen: "colin.ugen.renderTextArray",
            options: {
                array: colin.wind.cantoI
            },
            source: {
                ugen: "flock.ugen.amplitude",
                source: {
                    ugen: "flock.ugen.audioIn"
                },
                attack: 0.5,
                release: 0.5,
                mul: 20
            }
        },
        loop: 1.0
    };

}());
