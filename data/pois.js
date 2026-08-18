// Points of interest along the float route Thun–Bern, in downstream order.
// Positions verified on the ground by the site owner (do not blindly reset to OSM).
//
// Fields:
//   name/desc – multilingual strings, selected via the language switcher
//   icon      – overrides the type icon (see ICONS in app.js)
//   minZoom   – marker only appears from this zoom level (prevents overlapping icons)
//   A photo/logo appears in the popup automatically if img/<id>.jpg exists.
const POIS = [
  {
    id: 'vermietung-schwaebis',
    type: 'rental',
    lat: 46.76217, lon: 7.61887,
    minZoom: 16,
    url: 'https://aarebootsvermietung.ch',
    name: {
      de: 'Aarebootsvermietung',
      en: 'Aarebootsvermietung',
      fr: 'Aarebootsvermietung',
      it: 'Aarebootsvermietung',
      es: 'Aarebootsvermietung',
      nl: 'Aarebootsvermietung',
      pt: 'Aarebootsvermietung',
      zh: 'Aarebootsvermietung 租船处',
      ja: 'Aarebootsvermietung（ボートレンタル）',
      ar: 'Aarebootsvermietung لتأجير القوارب'
    },
    desc: {
      de: 'Miete ein Boot bei der Aarebootsvermietung – Fahrt von Schwäbis bis nach Bern (Eichholz). Schwimmwesten, Paddel und wasserdichte Tonne inklusive. Aarebootsvermietung-Boote enden in Eichholz.',
      en: 'Rent a boat at Aarebootsvermietung – float from Schwäbis down to Eichholz in Bern. Life jackets, paddles and a waterproof barrel are all included. Aarebootsvermietung rentals finish at Eichholz.',
      fr: 'Louez un bateau chez Aarebootsvermietung – descente de Schwäbis jusqu’à Berne (Eichholz). Gilets de sauvetage, pagaies et tonneau étanche inclus. Les bateaux Aarebootsvermietung se terminent à Eichholz.',
      it: 'Noleggia un gommone con Aarebootsvermietung – da Schwäbis fino a Berna (Eichholz). Giubbotti di salvataggio, pagaie e bidone impermeabile inclusi. I gommoni a noleggio terminano a Eichholz.',
      es: 'Alquila una lancha en Aarebootsvermietung – ruta desde Schwäbis hasta Berna (Eichholz). Chalecos salvavidas, remos y bidón impermeable incluidos. Las lanchas terminan en Eichholz.',
      nl: 'Huur een boot bij Aarebootsvermietung – tocht van Schwäbis naar Bern (Eichholz). Zwemvesten, peddels en waterdichte ton inbegrepen. Verhuurde boten eindigen in Eichholz.',
      pt: 'Alugue um barco na Aarebootsvermietung – trajeto de Schwäbis até Berna (Eichholz). Coletes salva-vidas, remos e barril estanque inclusos. Os barcos alugados terminam em Eichholz.',
      zh: '在 Aarebootsvermietung 租船 – 从 Schwäbis 漂流至伯尔尼（Eichholz）。包含救生衣、船桨和防水桶。租船行程在 Eichholz 结束。',
      ja: 'Aarebootsvermietung でボートをレンタル – シュヴェービス（Schwäbis）からベルン（Eichholz）まで。ライフジャケット、パドル、防水バレル付き。レンタルボートはアイヒホルツで返却。',
      ar: 'استأجر قارباً من Aarebootsvermietung – رحلة من شفيبيس إلى برن (آيخهولتس). سترات النجاة والمجاديف والبرميل المقاوم للماء مشمولة. تنتهي القوارب في آيخهولتس.'
    }
  },
  {
    id: 'schwaebis',
    type: 'entry',
    lat: 46.76199, lon: 7.61814,
    name: {
      de: 'Einstieg Schwäbis',
      en: 'Entry Schwäbis',
      fr: 'Embarquement Schwäbis',
      it: 'Ingresso Schwäbis',
      es: 'Entrada Schwäbis',
      nl: 'Instap Schwäbis',
      pt: 'Entrada Schwäbis',
      zh: 'Schwäbis 下水点',
      ja: 'シュヴェービス乗艇地点 (Schwäbis)',
      ar: 'نقطة دخول شفيبيس'
    },
    desc: {
      de: 'Offizielle und beliebteste Einwasserungsstelle.',
      en: 'Official and most popular boat entry point.',
      fr: 'Point de mise à l’eau officiel et le plus populaire.',
      it: 'Punto di ingresso ufficiale e più popolare per i gommoni.',
      es: 'Punto de entrada oficial y más popular para lanchas.',
      nl: 'Officiële en populairste instapplaats.',
      pt: 'Ponto de entrada oficial e mais popular para barcos.',
      zh: '官方且最受欢迎的下水起点。',
      ja: '公式で最も人気のあるボートエントリー地点。',
      ar: 'نقطة الانطلاق الرسمية والأكثر شعبية للقوارب.'
    }
  },
  {
    id: 'uttigenwelle',
    type: 'danger',
    icon: 'wave',
    lat: 46.79730, lon: 7.58180,
    name: {
      de: 'Uttigenwelle (SBB-Brücke)',
      en: 'Uttigen wave (railway bridge)',
      fr: 'Vague d’Uttigen (pont CFF)',
      it: 'Onda di Uttigen (ponte FFS)',
      es: 'Ola de Uttigen (puente ferroviario)',
      nl: 'Uttigen golf (spoorbrug)',
      pt: 'Onda de Uttigen (ponte ferroviária)',
      zh: 'Uttigen 浪区（铁路桥）',
      ja: 'ウッティゲンの波 / Uttigenwelle（鉄道橋）',
      ar: 'موجة أوتيغن (جسر القطار)'
    },
    desc: {
      de: 'Starke stehende Welle in der Flussmitte unter der Eisenbahnbrücke. RECHTS halten, ca. 5 m vom Ufer entfernt, und das Boot gerade halten. Bitte im Boot bleiben.',
      en: 'Strong standing wave in the middle of the river under the railway bridge. Keep to the RIGHT, about 5 m from the bank, and keep the boat straight. Please stay in the boat.',
      fr: 'Forte vague stationnaire au milieu de la rivière, sous le pont ferroviaire. Restez à DROITE, à env. 5 m de la rive, et gardez le bateau droit. Restez dans le bateau.',
      it: 'Forte onda stazionaria al centro del fiume sotto il ponte ferroviario. Tenersi a DESTRA, a circa 5 m dalla riva, e mantenere dritto il gommone. Rimanere a bordo.',
      es: 'Fuerte ola estacionaria en el centro del río bajo el puente del tren. Manténgase a la DERECHA, a unos 5 m de la orilla, y mantenga la lancha recta. Permanezca dentro.',
      nl: 'Sterke staande golf in het midden onder de spoorbrug. RECHTS aanhouden, ca. 5 m van de oever, en de boot recht houden. Blijf in de boot.',
      pt: 'Forte onda estacionária no meio do rio sob a ponte do trem. Mantenha-se à DIREITA, a cerca de 5 m da margem, e mantenha o barco reto. Fique dentro do barco.',
      zh: '铁路桥下河流中央有强烈的驻波。请靠右行驶（距右岸约 5 米），保持船身笔直，并切勿离开船只。',
      ja: '鉄道橋下の川中央に強い定常波。右側（岸から約5m）を進み、ボートをまっすぐに保ってください。ボートから降りないでください。',
      ar: 'موجة قوية في منتصف النهر تحت جسر القطار. الزم اليمين (حوالي 5 أمتار من الضفة) وحافظ على استقامة القارب. ابق داخل القارب.'
    }
  },
  {
    id: 'rubigen-wyderwasser',
    type: 'restaurant',
    lat: 46.89011, lon: 7.53777,
    name: {
      de: 'Rubigen – Wyderwasser',
      en: 'Rubigen – Wyderwasser',
      fr: 'Rubigen – Wyderwasser',
      it: 'Rubigen – Wyderwasser',
      es: 'Rubigen – Wyderwasser',
      nl: 'Rubigen – Wyderwasser',
      pt: 'Rubigen – Wyderwasser',
      zh: 'Rubigen – Wyderwasser',
      ja: 'ルビゲン – Wyderwasser',
      ar: 'روبيجين – فايدرفاسر'
    },
    desc: {
      de: 'Ausstieg RECHTS, ca. 100 m nach den Brückenpfeilern. Restaurant Campagna liegt auf der LINKEN Seite. Wyderwasser-Beizli direkt am Strand rechts. Grillplatz für Gruppen mit Reservation vorhanden.',
      en: 'Exit on the RIGHT, about 100 m after the bridge pillars. Restaurant Campagna is on the LEFT bank. The Wyderwasser beach bar is on the right bank. BBQ spot available for booked groups.',
      fr: 'Sortie à DROITE, env. 100 m après les piliers du pont. Le Restaurant Campagna se trouve sur la rive GAUCHE. Le bar Wyderwasser est directement sur la plage à droite. Place de gril disponible pour les groupes sur réservation.',
      it: 'Uscita a DESTRA, circa 100 m dopo i piloni del ponte. Il Restaurant Campagna si trova sulla riva SINISTRA. Bar Wyderwasser sulla spiaggia a destra. Area barbecue per gruppi su prenotazione.',
      es: 'Salida a la DERECHA, aprox. 100 m tras los pilares del puente. El Restaurant Campagna está en la orilla IZQUIERDA. Chiringuito Wyderwasser en la playa derecha. Zona de barbacoa con reserva.',
      nl: 'Uitstap RECHTS, ca. 100 m na de brugpijlers. Restaurant Campagna ligt op de LINKEROEVER. Wyderwasser-strandbar direct op het strand rechts. Barbecueplek voor groepen op reservering.',
      pt: 'Saída à DIREITA, cerca de 100 m após os pilares da ponte. O Restaurant Campagna fica na margem ESQUERDA. Bar de praia Wyderwasser à direita. Churrasqueira para grupos com reserva.',
      zh: '右侧上岸（桥墩后约 100 米）。Campagna 餐厅位于左岸。Wyderwasser 沙滩酒吧位于右侧。提供团体预约烧烤区。',
      ja: '橋脚を通過後約100m、右側から上陸可能。左岸に Restaurant Campagna、右岸ビーチに Wyderwasser バーがあります（要予約のBBQエリアあり）。',
      ar: 'الخروج إلى اليمين بعد أعمدة الجسر بـ 100 متر. مطعم كامبانيا على الضفة اليسرى وبار فايدرفاسر الشاطئي على اليمين. تتوفر منطقة شواء للمجموعات بالحجز.'
    }
  },
  {
    id: 'auguetbruecke',
    type: 'danger',
    icon: 'bridge',
    lat: 46.91901, lon: 7.50039,
    name: {
      de: 'Auguetbrücke (Holzbrücke)',
      en: 'Auguetbrücke (wooden bridge)',
      fr: 'Auguetbrücke (pont en bois)',
      it: 'Auguetbrücke (ponte in legno)',
      es: 'Auguetbrücke (puente de madera)',
      nl: 'Auguetbrücke (houten brug)',
      pt: 'Auguetbrücke (ponte de madeira)',
      zh: 'Auguetbrücke（木桥）',
      ja: 'アウグエット橋 / Auguetbrücke（木造橋）',
      ar: 'جسر أوغويت (جسر خشبي)'
    },
    desc: {
      de: 'Holzbrücke mit drei Pfeilern im Fluss – links oder rechts zwischen den Pfeilern durchfahren. Boot gerade halten, nicht in Brückennähe schwimmen.',
      en: 'Wooden bridge with three pillars in the river – pass between the pillars on the left or right side. Keep the boat straight and do not swim near the bridge.',
      fr: 'Pont en bois avec trois piliers dans la rivière – passez entre les piliers, à gauche ou à droite. Gardez le bateau droit et ne nagez pas près du pont.',
      it: 'Ponte in legno con tre piloni nel fiume – passare tra i piloni a sinistra o a destra. Mantenere dritto il gommone e non nuotare vicino al ponte.',
      es: 'Puente de madera con tres pilares – pase entre los pilares por la izquierda o la derecha. Mantenga la lancha recta y no nade cerca del puente.',
      nl: 'Houten brug met drie pijlers – vaar links of rechts tussen de pijlers door. Houd de boot recht en zwem niet bij de brug.',
      pt: 'Ponte de madeira com três pilares – passe entre os pilares pela esquerda ou direita. Mantenha o barco reto e não nade perto da ponte.',
      zh: '河中有三个桥墩的木桥 – 请从左侧或右侧桥墩之间穿过。保持船身笔直，切勿在桥梁附近游泳。',
      ja: '川の中に3本の橋脚がある木造橋。左右の橋脚の間を通過してください。ボートをまっすぐ保ち、橋の近くで泳がないでください。',
      ar: 'جسر خشبي به 3 أعمدة في النهر – اعبر بين الأعمدة يساراً أو يميناً. حافظ على استقامة القارب ولا تسبح قرب الجسر.'
    }
  },
  {
    id: 'eichholz',
    type: 'exit',
    lat: 46.93450, lon: 7.45820,
    hidden: true,
    name: {
      de: 'Ausstieg Eichholz',
      en: 'Exit Eichholz',
      fr: 'Sortie Eichholz',
      it: 'Uscita Eichholz',
      es: 'Salida Eichholz',
      nl: 'Uitstap Eichholz',
      pt: 'Saída Eichholz',
      zh: 'Eichholz 上岸点',
      ja: 'アイヒホルツ降艇地点 (Eichholz)',
      ar: 'نقطة خروج آيخهولتس'
    },
    desc: {
      de: 'Erster und einfachster Hauptausstieg in Bern: Ausstieg überall in der markierten Zone entlang des Campings Eichholz möglich. Für Aarebootsvermietung-Kunden ist dies der Ausstieg. Duschen, WC – Tram Nr. 9 fährt ins Stadtzentrum.',
      en: 'First and easiest main exit in Bern: you can get out anywhere in the marked zone along Camping Eichholz. This is the exit for Aarebootsvermietung rentals. Showers, WC – tram no. 9 takes you to the city centre.',
      fr: 'Première sortie principale et la plus facile à Berne : sortie possible partout dans la zone marquée le long du camping Eichholz. Pour les clients Aarebootsvermietung, c’est la sortie. Douches, WC – le tram n° 9 vous amène au centre-ville.',
      it: 'Prima e principale uscita a Berna: uscita possibile ovunque lungo la zona del Camping Eichholz. Uscita per clienti Aarebootsvermietung. Docce, WC – tram n. 9 per il centro.',
      es: 'Primera y principal salida en Berna: posible en cualquier punto de la zona señalizada junto al Camping Eichholz. Salida para clientes de Aarebootsvermietung. Duchas, WC – tranvía 9 al centro.',
      nl: 'Eerste en eenvoudigste hoofduitstap in Bern: uitstappen mogelijk overal langs Camping Eichholz. Dit is de uitstap voor huurders van Aarebootsvermietung. Douches, wc – tram 9 naar het centrum.',
      pt: 'Primeira e principal saída em Berna: possível em qualquer ponto da zona demarcada ao longo do Camping Eichholz. Saída para clientes Aarebootsvermietung. Duchas, WC – bonde nº 9 até o centro.',
      zh: '伯尔尼首个也是最主要的主上岸点：沿 Camping Eichholz 露营地的标记区域均可上岸。租船客户在此上岸。配有淋浴、洗手间，9路有轨电车直达市中心。',
      ja: 'ベルン市内最初で最も簡単なメイン上陸地点。キャンプ場沿いのマークされたエリアで上陸可能。Aarebootsvermietung の返却地点。シャワー・トイレ完備、トラム9番で市内中心部へ。',
      ar: 'نقطة الخروج الأولى والرئيسية في برن: الخروج متاح في كل المنطقة المحددة بجوار مخيم آيخهولتس. هذه نقطة خروج عملاء تأجير القوارب. تتوفر حمامات، والترام 9 ينقل إلى مركز المدينة.'
    }
  },

  {
    id: 'vermietung-eichholz',
    type: 'rental',
    lat: 46.93335, lon: 7.45745,
    minZoom: 15,
    url: 'https://aarebootsvermietung.ch',
    name: {
      de: 'Bootrückgabe Eichholz',
      en: 'Boat return Eichholz',
      fr: 'Retour bateau Eichholz',
      it: 'Riconsegna barche Eichholz',
      es: 'Devolución de lanchas Eichholz',
      nl: 'Boot inleveren Eichholz',
      pt: 'Devolução de barcos Eichholz',
      zh: 'Eichholz 还船点',
      ja: 'ボート返却場所 アイヒホルツ',
      ar: 'تسليم القوارب في آيخهولتس'
    },
    desc: {
      de: 'Rückgabeort für Aarebootsvermietung-Kunden: Boot hier ans Ufer bringen und dem Team übergeben. Der Ausstieg ist überall in der markierten Zone entlang des Campings möglich.',
      en: 'Return point for Aarebootsvermietung customers: bring the boat to shore here and hand it to the team. Exit is possible anywhere in the marked zone along the camping.',
      fr: "Point de retour pour les clients Aarebootsvermietung : amenez le bateau ici et remettez-le à l'équipe. La sortie est possible partout dans la zone marquée le long du camping.",
      it: 'Punto di riconsegna per i clienti Aarebootsvermietung: portare il gommone a riva qui e consegnarlo al personale. Uscita consentita ovunque nella zona del camping.',
      es: 'Punto de entrega para clientes de Aarebootsvermietung: lleve la lancha a la orilla aquí y entréguela al equipo. Salida posible a lo largo de todo el camping.',
      nl: 'Inleverpunt voor klanten van Aarebootsvermietung: breng de boot hier naar de kant en overhandig deze aan het team. Uitstappen kan overal langs de campingzone.',
      pt: 'Ponto de devolução para clientes Aarebootsvermietung: traga o barco até a margem aqui e entregue à equipe. Saída possível em toda a extensão do camping.',
      zh: 'Aarebootsvermietung 客户还船处：请将船只靠岸并交还给工作人员。在露营地标记区域均可上岸。',
      ja: 'Aarebootsvermietung 利用者の返却地点: ここでボートを岸に寄せてスタッフに引き渡してください。キャンプ場沿いのゾーンならどこでも上陸可能です。',
      ar: 'نقطة تسليم القوارب لعملاء التأجير: أحضر القارب إلى الضفة وسلمه للموظفين. الخروج متاح على طول منطقة المخيم.'
    }
  },

  {
    id: 'schwelle',
    type: 'weir',
    lat: 46.94578, lon: 7.45191,
    minZoom: 13,
    name: {
      de: 'Wehr Schwellenmätteli – LEBENSGEFAHR',
      en: 'Schwellenmätteli weir – DANGER',
      fr: 'Barrage Schwellenmätteli – DANGER',
      it: 'Diga Schwellenmätteli – PERICOLO',
      es: 'Presa Schwellenmätteli – PELIGRO',
      nl: 'Stuw Schwellenmätteli – GEVAAR',
      pt: 'Represa Schwellenmätteli – PERIGO',
      zh: 'Schwellenmätteli 水坝 – 极度危险',
      ja: 'シュヴェレンメッテリ堰 – 危険',
      ar: 'سد شفيلميتيلي – خطر'
    },
    desc: {
      de: 'Lebensgefahr! Wehr mit starker Walze. Gesperrte Zone für Schwimmer und Boote. Niemals weiterfahren – spätestens im Eichholz aussteigen.',
      en: 'Deadly weir – closed to all swimmers and boats. Never continue past Eichholz.',
      fr: 'Danger de mort ! Barrage avec fort rappel. Zone interdite aux nageurs et aux bateaux. Ne continuez jamais – sortez au plus tard à Eichholz.',
      it: 'Pericolo di morte! Diga con forte risucchio. Zona vietata a nuotatori e gommoni. Non proseguire mai oltre – uscire al più tardi a Eichholz.',
      es: '¡Peligro de muerte! Presa con fuerte corriente de retorno. Zona prohibida para bañistas y embarcaciones. No continúe nunca – salga como muy tarde en Eichholz.',
      nl: 'Levensgevaar! Stuw met sterke zuiging. Verboden zone voor zwemmers en boten. Nooit doorvaren – uiterlijk bij Eichholz uitstappen.',
      pt: 'Perigo mortal! Represa com refluxo perigoso. Zona proibida para banhistas e barcos. Nunca continue – saia o mais tardar em Eichholz.',
      zh: '致命危险！水坝处有巨大吸力和翻滚水流。严禁任何游泳者或船只进入。切勿继续前行 – 最迟必须在 Eichholz 上岸。',
      ja: '生命の危険！強い巻き込み水流がある堰。遊泳およびボート進入禁止エリア。決してこれ以上進まないでください。必ずアイヒホルツで上陸してください。',
      ar: 'خطر الموت! سد ذو دوامات وتيارات شديدة الخطورة. منطقة محظورة على السباحين والقوارب. لا تتابع السير أبداً – اخرج في آيخهولتس على أبعد تقدير.'
    }
  }
];

// Bank stretches where getting out is possible anywhere (drawn as a zone along the river,
// not as a single point). Anchors snap to the nearest vertices of the route line;
// `side` is the bank seen in downstream direction.
const EXIT_ZONES = [
  {
    id: 'eichholz-zone',
    photo: 'eichholz', // popup photo file: img/eichholz.jpg (shared with the Eichholz POI)
    // extended further west and east to better match the park paths/trees
    from: { lat: 46.93478, lon: 7.45900 },
    to: { lat: 46.93415, lon: 7.45480 },
    side: 'left',
    name: {
      de: 'Ausstiegszone Eichholz',
      en: 'Exit zone Eichholz',
      fr: 'Zone de sortie Eichholz',
      it: 'Zona di uscita Eichholz',
      es: 'Zona de salida Eichholz',
      nl: 'Uitstapzone Eichholz',
      pt: 'Zona de saída Eichholz',
      zh: 'Eichholz 上岸区',
      ja: 'アイヒホルツ上陸エリア',
      ar: 'منطقة خروج آيخهولتس'
    },
    desc: {
      de: 'Ausstieg überall in dieser Zone entlang des Campings Eichholz möglich. Für Aarebootsvermietung-Kunden ist dies der Ausstieg.',
      en: 'You can get out anywhere in this zone along the Camping Eichholz bank. This is the exit for Aarebootsvermietung rentals.',
      fr: 'Sortie possible partout dans cette zone le long du camping Eichholz. Pour les clients Aarebootsvermietung, c’est la sortie.',
      it: 'Uscita possibile ovunque in questa zona lungo la riva del Camping Eichholz. Uscita per clienti Aarebootsvermietung.',
      es: 'Salida posible en cualquier punto de esta zona junto a la orilla del Camping Eichholz. Salida para clientes de Aarebootsvermietung.',
      nl: 'Uitstappen overal mogelijk in deze zone langs de oever van Camping Eichholz. Dit is de uitstap voor huurders van Aarebootsvermietung.',
      pt: 'Saída possível em qualquer ponto desta zona ao longo da margem do Camping Eichholz. Saída para clientes Aarebootsvermietung.',
      zh: '沿 Camping Eichholz 露营地河岸的此区域均可上岸。租船客户在此上岸。',
      ja: 'Camping Eichholz 沿いのこのゾーン内ならどこでも上陸可能。Aarebootsvermietung 利用者の降艇地点です。',
      ar: 'الخروج متاح في أي مكان في هذه المنطقة على طول ضفة مخيم آيخهولتس. نقطة خروج عملاء التأجير.'
    }
  }
];
