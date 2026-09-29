// Tanuki Box のトップページ（TanukiBox/tanukibox.github.io）の games.js に入れる DINO DUEL の箱。
// 公開するときは、この { ... } を window.TB_GAMES = [ のすぐ下に貼り、同じフォルダの絵3枚を assets/games/ に入れて、index.html の ?v= を1つ上げる。
  {
    id: 'dino-duel',
    status: 'out',
    isNew: true,
    title: 'DINO DUEL',
    sub: { ja: '恐竜カードバトル', en: 'Dino card battle' },
    desc: {
      ja: '技が当たる瞬間にタップ！ 3体対3体の恐竜カードバトル。賞金でパックを引いて40種の恐竜を集め、5つの大会を勝ちぬこう。',
      en: 'Tap as each move lands! A 3-vs-3 dino card battle. Win prize money, pull packs, collect 40 dinos and conquer 5 cups.'
    },
    play: 'DINO-DUEL/',
    steam: null,
    video: null,
    poster: 'assets/games/dino-duel-poster.jpg',
    art: { ja: 'assets/games/dino-duel.png', en: 'assets/games/dino-duel-en.png' },
    box: '#f6b26b',
    time: { ja: '1試合約2分', en: '~2 min per match' },
    control: { ja: '片手でタップ', en: 'One tap' },
    devices: ['phone', 'pc']
  },
