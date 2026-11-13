// The host's script.
// Each line: text = Hinglish shown on screen, hi = Devanagari spoken by a Hindi voice,
// en = English (shown in English mode, spoken when no Hindi voice is installed), mood = delivery.
// In spoken text "..." is a dramatic pause and "|" a short one.
import { pick } from "../lib/random";
import { formatINR, inrWords } from "../lib/format";

const L = (text, hi, en, mood = "warm") => ({ text, hi, en, mood });
const tag = (id, ...args) => ({ ...L(...args), id });
// Option letters as a Hindi voice should say them inside a Devanagari sentence.
const hiL = (letter) => ({ A: "ए", B: "बी", C: "सी", D: "डी" })[letter] ?? letter;

const HI_AMOUNT = {
  0: "शून्य",
  1000: "एक हज़ार",
  2000: "दो हज़ार",
  3000: "तीन हज़ार",
  5000: "पाँच हज़ार",
  10000: "दस हज़ार",
  20000: "बीस हज़ार",
  40000: "चालीस हज़ार",
  80000: "अस्सी हज़ार",
  160000: "एक लाख साठ हज़ार",
  320000: "तीन लाख बीस हज़ार",
  640000: "छह लाख चालीस हज़ार",
  1250000: "साढ़े बारह लाख",
  2500000: "पच्चीस लाख",
  5000000: "पचास लाख",
  10000000: "एक करोड़",
  70000000: "सात करोड़",
};
const hiAmt = (n) => `${HI_AMOUNT[n] ?? n} रुपये`;
const enAmt = (n) => (n >= 1e7 ? `${n / 1e7} crore rupees` : `${inrWords(n).toLowerCase()} rupees`);
const showAmt = (n) => (n >= 1e7 ? `₹${n / 1e7} Crore` : formatINR(n));

const ORD_HI = ["", "पहला", "दूसरा", "तीसरा", "चौथा", "पाँचवाँ", "छठा", "सातवाँ", "आठवाँ", "नौवाँ", "दसवाँ", "ग्यारहवाँ", "बारहवाँ", "तेरहवाँ", "चौदहवाँ", "पंद्रहवाँ", "सोलहवाँ"];
const ORD_TX = ["", "pehla", "doosra", "teesra", "chautha", "paanchvaan", "chhatha", "saatvaan", "aathvaan", "nauvaan", "dasvaan", "gyarahvaan", "barahvaan", "terahvaan", "chaudahvaan", "pandrahvaan", "solahvaan"];
const ORD_EN = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth"];

const script = {
  splash: () =>
    L(
      "Deviyon aur Sajjanon... swagat hai aapka... Kaun Banega Crorepati mein!",
      "देवियों और सज्जनों... स्वागत है आपका... कौन बनेगा करोड़पति में!",
      "Ladies and gentlemen... welcome... to Kaun Banega Crorepati!",
      "dramatic"
    ),

  menuGreeting: (name, hour, lastPrize) => {
    if (lastPrize >= 320000 && Math.random() < 0.5)
      return L(`Waah ${name} ji! Pichhli baar toh aapne kamaal kar diya tha. Aaj phir?`, `वाह ${name} जी! पिछली बार तो आपने कमाल कर दिया था... आज फिर?`, `Welcome back, ${name}! You were brilliant last time. Ready to do it again?`, "excited");
    if (hour < 5 || hour >= 23)
      return L(`Itni raat ko bhi gyaan ki pyaas? Swagat hai, ${name} ji!`, `इतनी रात को भी ज्ञान की प्यास? स्वागत है, ${name} जी!`, `Still thirsty for knowledge at this hour? Welcome, ${name}!`);
    if (hour < 12) return L(`Shubh prabhat, ${name} ji! Aaiye, khelte hain.`, `शुभ प्रभात, ${name} जी! आइए... खेलते हैं।`, `Good morning, ${name}! Shall we play?`);
    if (hour < 17) return L(`Namaskar, ${name} ji! Swagat hai aapka.`, `नमस्कार, ${name} जी! स्वागत है आपका।`, `Namaskar, ${name}! Welcome.`);
    return L(`Shubh sandhya, ${name} ji! Hot seat aapka intezaar kar rahi hai.`, `शुभ संध्या, ${name} जी! हॉट सीट आपका इंतज़ार कर रही है।`, `Good evening, ${name}! The hot seat is waiting for you.`);
  },

  welcome: (name, city) =>
    pick([
      L(
        `Deviyon aur Sajjanon! Hot seat par swagat kijiye... ${name}${city ? `, ${city} se` : ""}!`,
        `देवियों और सज्जनों! हॉट सीट पर स्वागत कीजिए... ${name}${city ? `, ${city} से` : ""}!`,
        `Ladies and gentlemen! Please welcome to the hot seat... ${name}${city ? `, from ${city}` : ""}!`,
        "excited"
      ),
      L(
        `Aaiye ${name} ji... baithiye. Aaram se baithiye. Kaun Banega Crorepati mein aapka swagat hai.`,
        `आइए ${name} जी... बैठिए। आराम से बैठिए। कौन बनेगा करोड़पति में आपका स्वागत है।`,
        `Come, ${name}... have a seat. Make yourself comfortable. Welcome to Kaun Banega Crorepati.`
      ),
    ]),

  rules: () =>
    pick([
      L(
        "Solah sawaal... do padaav... aur aapke paas hain chaar lifelines. Toh chaliye... khel shuru karte hain!",
        "सोलह सवाल... दो पड़ाव... और आपके पास हैं चार लाइफ़लाइन। तो चलिए... खेल शुरू करते हैं!",
        "Sixteen questions... two milestones... and four lifelines. So let's... begin!",
        "excited"
      ),
      L(
        "Niyam aap jaante hain. Galat jawab par aap pichhle padaav par laut aayenge. Toh dhyaan se khelna... shuru karte hain!",
        "नियम आप जानते हैं। ग़लत जवाब पर आप पिछले पड़ाव पर लौट आएँगे। तो ध्यान से खेलिएगा... शुरू करते हैं!",
        "You know the rules. A wrong answer takes you back to the last milestone. So play carefully... let's begin!"
      ),
    ]),

  questionIntro: (level, amount, name) => {
    if (level === 16)
      return tag("jackpotQuestion", "Saat... crore... rupaye ka sawaal. Yeh raha... aapki screen par.", "सात... करोड़... रुपये का सवाल। ये रहा... आपकी स्क्रीन पर।", "The question... for seven... crore... rupees. Here it is.", "dramatic");
    if (level === 15)
      return tag("croreQuestion", "Ek crore rupaye ka sawaal... dil thaam ke baithiye.", "एक करोड़ रुपये का सवाल... दिल थाम के बैठिए।", "The one crore rupee question... hold on to your heart.", "dramatic");
    if (level === 11)
      return L(
        `Ab ghadi nahi chalegi... jitna chahe utna sochiye. Gyarahvaan sawaal... ${showAmt(amount)} ke liye.`,
        `अब घड़ी नहीं चलेगी... जितना चाहें, उतना सोचिए। ग्यारहवाँ सवाल... ${hiAmt(amount)} के लिए।`,
        `From now on there's no clock... take all the time you need. Question eleven... for ${enAmt(amount)}.`,
        "calm"
      );
    if (level === 10)
      return L(`Doosre padaav ka sawaal... ${showAmt(amount)} ke liye.`, `दूसरे पड़ाव का सवाल... ${hiAmt(amount)} के लिए।`, `The second milestone question... for ${enAmt(amount)}.`, "tense");
    if (level === 5) return L(`Pehle padaav ka sawaal... ${showAmt(amount)} ke liye.`, `पहले पड़ाव का सवाल... ${hiAmt(amount)} के लिए।`, `The first milestone question... for ${enAmt(amount)}.`, "tense");
    if (level === 1)
      return L(
        `Toh ${name} ji, aapka pehla sawaal... ${showAmt(amount)} ke liye. Yeh raha aapki screen par.`,
        `तो ${name} जी, आपका पहला सवाल... ${hiAmt(amount)} के लिए। ये रहा आपकी स्क्रीन पर।`,
        `So, ${name}, your first question... for ${enAmt(amount)}. Here it is on your screen.`
      );
    return pick([
      L(`Sawaal number ${level}... ${showAmt(amount)} ke liye. Yeh raha aapki screen par.`, `सवाल नंबर ${level}... ${hiAmt(amount)} के लिए। ये रहा आपकी स्क्रीन पर।`, `Question number ${level}... for ${enAmt(amount)}. Here it is.`, level >= 12 ? "tense" : "warm"),
      L(`${ORD_TX[level][0].toUpperCase() + ORD_TX[level].slice(1)} sawaal... ${showAmt(amount)} ke liye.`, `${ORD_HI[level]} सवाल... ${hiAmt(amount)} के लिए।`, `Your ${ORD_EN[level]} question... for ${enAmt(amount)}.`, level >= 12 ? "tense" : "warm"),
    ]);
  },

  startClock: () => L("Aapka samay shuru hota hai... ab!", "आपका समय शुरू होता है... अब!", "Your time starts... now!", "excited"),
  clockLow: () =>
    pick([
      L("Ghadi ki sui tez chal rahi hai...", "घड़ी की सुई तेज़ चल रही है...", "The clock is ticking fast...", "tense"),
      L("Samay kam hai... jaldi faisla kijiye.", "समय कम है... जल्दी फ़ैसला कीजिए।", "Time is running out... decide quickly.", "tense"),
    ]),
  idle: () =>
    pick([
      L("Aaram se sochiye... koi jaldi nahi hai.", "आराम से सोचिए... कोई जल्दी नहीं है।", "Take your time... there's no hurry.", "calm"),
      L("Kya soch rahe hain? Lifelines bhi hain aapke paas.", "क्या सोच रहे हैं? लाइफ़लाइन भी हैं आपके पास।", "What's on your mind? You have lifelines too, remember.", "calm"),
    ]),

  confirm: (letter) =>
    pick([
      L(`${letter}... lock kiya jaye?`, `${hiL(letter)}... लॉक किया जाए?`, `${letter}... shall we lock it?`, "calm"),
      L(`Aapka jawab hai ${letter}... lock kar dein?`, `आपका जवाब है ${hiL(letter)}... लॉक कर दें?`, `Your answer is ${letter}... shall I lock it?`, "calm"),
      L(`Pakka? ${letter} lock kiya jaye?`, `पक्का? ${hiL(letter)} लॉक किया जाए?`, `Sure? Lock ${letter}?`, "calm"),
    ]),
  quickPick: () => L("Itni jaldi? Lagta hai aapko poora yakeen hai!", "इतनी जल्दी? लगता है आपको पूरा यक़ीन है!", "So quick? You must be very sure!", "excited"),
  changed: () => L("Aapne apna jawab badal diya... theek hai.", "आपने अपना जवाब बदल दिया... ठीक है।", "You've changed your answer... alright.", "calm"),
  locked: (letter) =>
    pick([
      L(`Computer ji... ${letter} lock kiya jaye.`, `कंप्यूटर जी... ${hiL(letter)} लॉक किया जाए।`, `Computer... please lock ${letter}.`, "dramatic"),
      L(`${letter}... lock kar diya gaya hai.`, `${hiL(letter)}... लॉक कर दिया गया है।`, `${letter}... is locked in.`, "dramatic"),
      L(`Computer ji, kripya ${letter} ko lock kar dijiye.`, `कंप्यूटर जी, कृपया ${hiL(letter)} को लॉक कर दीजिए।`, `Computer, kindly lock ${letter}.`, "dramatic"),
    ]),
  suspense: () =>
    pick([
      L("Dekhte hain... kya yeh sahi jawab hai...", "देखते हैं... क्या ये सही जवाब है...", "Let's see... is it the right answer...", "whisper"),
      L("Dil ki dhadkanein tez hain...", "दिल की धड़कनें तेज़ हैं...", "Hearts are racing...", "whisper"),
      L("Yeh pal... bahut bhaari hai...", "ये पल... बहुत भारी है...", "This moment... is a heavy one...", "whisper"),
    ]),

  correct: (level, amount, { lifeline, friend, streak } = {}) => {
    if (friend && Math.random() < 0.6)
      return L(`${friend} ne dosti nibha di! Sahi jawab... ${showAmt(amount)}!`, `${friend} ने दोस्ती निभा दी! सही जवाब... ${hiAmt(amount)}!`, `${friend} came through for you! Correct... ${enAmt(amount)}!`, "excited");
    if (lifeline && Math.random() < 0.5)
      return L(`Lifeline kaam aa gayi! Sahi jawab... ${showAmt(amount)}!`, `लाइफ़लाइन काम आ गई! सही जवाब... ${hiAmt(amount)}!`, `The lifeline paid off! Correct... ${enAmt(amount)}!`, "excited");
    if (streak >= 4 && Math.random() < 0.5)
      return L(`Lagataar sahi jawab... kya baat hai! ${showAmt(amount)} aapke!`, `लगातार सही जवाब... क्या बात है! ${hiAmt(amount)} आपके!`, `Correct again... what a streak! ${enAmt(amount)} is yours!`, "excited");
    if (level >= 11)
      return pick([
        L(`Kamaal kar diya aapne! ${showAmt(amount)}!`, `कमाल कर दिया आपने! ${hiAmt(amount)}!`, `Brilliant! ${enAmt(amount)}!`, "excited"),
        L(`Bilkul sahi! ${showAmt(amount)}... ab aapke hain!`, `बिल्कुल सही! ${hiAmt(amount)}... अब आपके हैं!`, `Absolutely right! ${enAmt(amount)}... is now yours!`, "excited"),
      ]);
    return pick([
      L(`Sahi jawab! Aap jeet chuke hain... ${showAmt(amount)}!`, `सही जवाब! आप जीत चुके हैं... ${hiAmt(amount)}!`, `Correct answer! You have won... ${enAmt(amount)}!`, "excited"),
      L(`Ekdum sahi jawab! ${showAmt(amount)}!`, `एकदम सही जवाब! ${hiAmt(amount)}!`, `Spot on! ${enAmt(amount)}!`, "excited"),
      L(`Bilkul sahi! Shabaash! ${showAmt(amount)} aapke.`, `बिल्कुल सही! शाबाश! ${hiAmt(amount)} आपके।`, `Absolutely right! Well done! ${enAmt(amount)} is yours.`, "excited"),
    ]);
  },

  milestone: (level) =>
    level === 5
      ? tag("padaav1", "Pehla padaav paar! Das hazaar rupaye... ab aapse koi nahi chheen sakta!", "पहला पड़ाव पार! दस हज़ार रुपये... अब आपसे कोई नहीं छीन सकता!", "First milestone crossed! Ten thousand rupees... nobody can take that away from you now!", "excited")
      : tag("padaav2", "Doosra padaav! Teen lakh bees hazaar rupaye... pakke ho gaye!", "दूसरा पड़ाव! तीन लाख बीस हज़ार रुपये... पक्के हो गए!", "Second milestone! Three lakh twenty thousand rupees... guaranteed!", "excited"),
  flipUnlocked: () =>
    L("Badhai ho! Ek nayi lifeline khul gayi hai... Flip the Question!", "बधाई हो! एक नई लाइफ़लाइन खुल गई है... फ़्लिप द क्वेश्चन!", "Congratulations! A new lifeline is unlocked... Flip the Question!", "excited"),

  wrong: (letter, safe) =>
    safe
      ? L(`Afsos... yeh galat jawab hai. Sahi jawab tha ${letter}. Lekin aap ${showAmt(safe)} lekar ja rahe hain.`, `अफ़सोस... ये ग़लत जवाब है। सही जवाब था ${hiL(letter)}। लेकिन आप ${hiAmt(safe)} लेकर जा रहे हैं।`, `I'm sorry... that's the wrong answer. The right answer was ${letter}. But you still take home ${enAmt(safe)}.`, "sad")
      : L(`Afsos... yeh galat jawab hai. Sahi jawab tha ${letter}. Aaj kismat ne saath nahi diya.`, `अफ़सोस... ये ग़लत जवाब है। सही जवाब था ${hiL(letter)}। आज क़िस्मत ने साथ नहीं दिया।`, `I'm sorry... that's the wrong answer. The right answer was ${letter}. Luck wasn't with you today.`, "sad"),
  timeUp: (amount) =>
    L(`Samay samaapt! Aap ${showAmt(amount)} lekar ja rahe hain.`, `समय समाप्त! आप ${hiAmt(amount)} लेकर जा रहे हैं।`, `Time's up! You leave with ${enAmt(amount)}.`, "sad"),

  lifeline: {
    fifty: () => L("Computer ji... do galat jawab hata dijiye.", "कंप्यूटर जी... दो ग़लत जवाब हटा दीजिए।", "Computer... please remove two wrong answers.", "dramatic"),
    fiftyDone: () => L("Ab bache hain do... ek sahi, ek galat.", "अब बचे हैं दो... एक सही, एक ग़लत।", "Two remain... one right, one wrong.", "calm"),
    poll: () => L("Darshakon se poochhte hain! Audience... apne keypad uthaiye, aur vote kijiye!", "दर्शकों से पूछते हैं! ऑडियंस... अपने कीपैड उठाइए, और वोट कीजिए!", "Let's ask the audience! Audience... pick up your keypads, and vote!", "excited"),
    pollResult: (top) =>
      top >= 60
        ? L("Darshakon ki raay bilkul saaf hai...", "दर्शकों की राय बिल्कुल साफ़ है...", "The audience is very clear...", "calm")
        : top >= 40
          ? L("Darshakon ka jhukaav ek taraf hai... par faisla aapka.", "दर्शकों का झुकाव एक तरफ़ है... पर फ़ैसला आपका।", "The audience leans one way... but the decision is yours.", "calm")
          : L("Darshak bhi uljhan mein hain...", "दर्शक भी उलझन में हैं...", "Even the audience is confused...", "calm"),
    phone: () => L("Chaliye, aapke dost ko phone lagaate hain. Kise call karna chahenge?", "चलिए, आपके दोस्त को फ़ोन लगाते हैं। किसे कॉल करना चाहेंगे?", "Let's phone a friend. Whom would you like to call?"),
    phoneToFriend: (friend, player) =>
      L(
        `Namaskar ${friend} ji! Main Kaun Banega Crorepati se bol raha hoon. Aapke dost ${player} hot seat par hain... aur unhe aapki madad chahiye. Aapka samay shuru hota hai... ab!`,
        `नमस्कार ${friend} जी! मैं कौन बनेगा करोड़पति से बोल रहा हूँ। आपके दोस्त ${player} हॉट सीट पर हैं... और उन्हें आपकी मदद चाहिए। आपका समय शुरू होता है... अब!`,
        `Namaskar, ${friend}! I'm calling from Kaun Banega Crorepati. Your friend ${player} is in the hot seat... and needs your help. Your time starts... now!`
      ),
    phoneAfter: (friend) => L(`${friend} ji ne apni raay de di hai... ab faisla aapka.`, `${friend} जी ने अपनी राय दे दी है... अब फ़ैसला आपका।`, `${friend} has given their opinion... now the decision is yours.`, "calm"),
    expert: () => L("Hamare visheshagya se poochhte hain...", "हमारे विशेषज्ञ से पूछते हैं...", "Let's ask our expert...", "calm"),
    expertAfter: () => L("Visheshagya ki raay aapke saamne hai.", "विशेषज्ञ की राय आपके सामने है।", "You have the expert's opinion.", "calm"),
    flip: () => L("Naya sawaal... usi rakam ke liye!", "नया सवाल... उसी रक़म के लिए!", "A brand new question... for the same amount!", "excited"),
  },

  quitAsk: (amount) => L(`Kya aap ${showAmt(amount)} lekar khel chhodna chahte hain?`, `क्या आप ${hiAmt(amount)} लेकर खेल छोड़ना चाहते हैं?`, `Do you want to walk away with ${enAmt(amount)}?`, "calm"),
  quitGuess: () =>
    L("Khel chhodne ke baad... bas itna bataiye... aap kaunsa jawab chunte?", "खेल छोड़ने के बाद... बस इतना बताइए... आप कौन सा जवाब चुनते?", "You've walked away... but just tell me... which answer would you have chosen?", "calm"),
  guessResult: (right) =>
    right
      ? L("Arre! Aapka jawab sahi hota!", "अरे! आपका जवाब सही होता!", "Oh! You would have been right!", "excited")
      : L("Sahi faisla! Aapka jawab galat hota.", "सही फ़ैसला! आपका जवाब ग़लत होता।", "Wise decision! That would have been wrong.", "warm"),

  crore: () => L("Ek... crore! Aap crorepati ban gaye hain!", "एक... करोड़! आप करोड़पति बन गए हैं!", "One... crore! You are a crorepati!", "excited"),
  jackpotWarn: () =>
    L(
      "Dhyaan rahe... galat jawab par aap teen lakh bees hazaar par aa jayenge. Khelenge... ya quit karenge?",
      "ध्यान रहे... ग़लत जवाब पर आप तीन लाख बीस हज़ार पर आ जाएँगे। खेलेंगे... या क्विट करेंगे?",
      "Remember... a wrong answer drops you to three lakh twenty thousand. Will you play... or walk away?",
      "tense"
    ),
  jackpot: () => L("Saat... crore! Aapne itihaas rach diya hai!", "सात... करोड़! आपने इतिहास रच दिया है!", "Seven... crore! You have made history!", "excited"),

  // Fastest Finger First
  fff: {
    intro: () =>
      L(
        "Fastest Finger First! Sabse pehle sahi kram mein lagaiye... aur hot seat aapki!",
        "फ़ास्टेस्ट फ़िंगर फ़र्स्ट! सबसे पहले सही क्रम में लगाइए... और हॉट सीट आपकी!",
        "Fastest Finger First! Put them in the right order fastest... and the hot seat is yours!",
        "excited"
      ),
    question: () => L("Yeh raha sawaal...", "ये रहा सवाल...", "Here's the question...", "calm"),
    go: () => tag("startClock", "Aapka samay shuru hota hai... ab!", "आपका समय शुरू होता है... अब!", "Your time starts... now!", "excited"),
    locked: () => L("Sabke jawab aa chuke hain.", "सबके जवाब आ चुके हैं।", "All the answers are in.", "calm"),
    order: () => L("Sahi kram hai...", "सही क्रम है...", "The correct order is...", "dramatic"),
    winner: (name, secs) =>
      L(`Sabse tez aur sahi jawab... ${name}! ${secs} second mein! Badhai ho!`, `सबसे तेज़ और सही जवाब... ${name}! ${secs} सेकंड में! बधाई हो!`, `Fastest and correct... ${name}! In ${secs} seconds! Congratulations!`, "excited"),
    lost: (name, city) => L(`Is baar sabse tez rahe... ${name}, ${city} se.`, `इस बार सबसे तेज़ रहे... ${name}, ${city} से।`, `This time the fastest was... ${name}, from ${city}.`, "calm"),
    nobody: () => L("Is baar kisi ne bhi sahi jawab nahi diya.", "इस बार किसी ने भी सही जवाब नहीं दिया।", "Nobody got it right this time.", "calm"),
    nextRound: () => L("Koi baat nahi... agla round!", "कोई बात नहीं... अगला राउंड!", "Never mind... next round!", "warm"),
    wildcard: () =>
      L("Lekin aaj hum aapko wildcard se hot seat par bula rahe hain!", "लेकिन आज हम आपको वाइल्डकार्ड से हॉट सीट पर बुला रहे हैं!", "But today, we're inviting you to the hot seat as a wildcard!", "excited"),
  },

  // Result
  transfer: () => L("Ye gaye paise... aapke account mein!", "ये गए पैसे... आपके अकाउंट में!", "And there goes the money... straight into your account!", "excited"),
  goodbye: (prize) =>
    prize >= 1e7
      ? L("Aapka naam ab itihaas mein hai. Bahut bahut badhai!", "आपका नाम अब इतिहास में है। बहुत-बहुत बधाई!", "Your name is in history now. Many, many congratulations!", "excited")
      : prize > 0
        ? pick([
            L("Bahut achha khele aap. Phir milenge... agle sawaal ke saath!", "बहुत अच्छा खेले आप। फिर मिलेंगे... अगले सवाल के साथ!", "You played really well. See you again... with the next question!"),
            L("Gyaan ki is yatra mein aap kaafi aage aaye. Shabaash!", "ज्ञान की इस यात्रा में आप काफ़ी आगे आए। शाबाश!", "You went far on this journey of knowledge. Well done!"),
          ])
        : L("Koi baat nahi... agli baar zaroor jeetenge.", "कोई बात नहीं... अगली बार ज़रूर जीतेंगे।", "Never mind... you'll surely win next time.", "warm"),
};

// Every line carries a moment id (e.g. "lifeline.poll") so a recorded Voice Pack clip can stand in
// for it. Lines that set their own id (milestones, the big-money questions) keep it.
const tagged = (obj, prefix = "") =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === "function" ? (...args) => ({ id: prefix + k, ...v(...args) }) : tagged(v, `${prefix}${k}.`)])
  );
export const host = tagged(script);

export const lineText = (line, language) => (language === "english" ? line.en : line.text);
export { showAmt, enAmt, hiAmt };
