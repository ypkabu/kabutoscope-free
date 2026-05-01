import type { AccountType, EmotionTag, InvestmentHorizon, PositionPurpose, TradeActionType } from "./types";

export const actionTypeLabels: Record<TradeActionType, string> = {
  BUY_PLAN: "買う前の計画",
  BUY: "実際に買った",
  SELL_PLAN: "売る前の計画",
  SELL: "実際に売った",
  HOLD: "継続保有",
  REVIEW: "見直し"
};

export const accountTypeLabels: Record<AccountType, string> = {
  NISA: "NISA",
  TOKUTEI: "特定口座",
  WATCH_ONLY: "監視のみ"
};

export const emotionTagLabels: Record<EmotionTag, string> = {
  calm: "冷静",
  planned: "計画通り",
  fear_of_missing_out: "置いていかれそうで焦り",
  panic: "パニック",
  revenge_trade: "取り返したい",
  uncertain: "自信なし・迷い中"
};

export type JournalTemplate = {
  reason: string;
  expectedScenario: string;
  exitCondition: string;
  takeProfitCondition: string;
  stopLossCondition: string;
  emotionTag: EmotionTag;
};

const defaultTemplates: Record<string, JournalTemplate> = {
  "7013.T": {
    reason: "防衛・宇宙・重工テーマの短期〜中期候補。半導体とは違うテーマで分散できるため、少額で監視・購入を検討する。",
    expectedScenario: "防衛・宇宙関連の材料や決算が評価され、3,200円付近まで上昇する場合は一部利確を検討する。",
    exitCondition: "2,600円を割る、決算内容が悪い、防衛・重工テーマ全体が崩れる場合は見直す。",
    takeProfitCondition: "3,200円で一部利確。3,500円以上なら強めに利確を検討する。",
    stopLossCondition: "2,500円割れ、または決算悪化が明確な場合は損切り検討。",
    emotionTag: "planned"
  },
  "9434.T": {
    reason: "配当とPayPay優待目的。100株でも必要資金が少なく、長期保有しやすいためNISA枠で検討する。",
    expectedScenario: "配当と優待を受け取りながら長期保有する。短期の値上がりより、安定したインカムと優待を重視する。",
    exitCondition: "減配、優待改悪、通信事業の悪化、200円割れかつ悪材料ありの場合は見直す。",
    takeProfitCondition: "基本は売らない。260円以上まで上がり、他に優先したい投資先がある場合のみ利確を検討する。",
    stopLossCondition: "単純な短期下落では損切りしない。減配・優待改悪・業績悪化が重なった場合に見直す。",
    emotionTag: "planned"
  },
  "9432.T": {
    reason: "通信インフラ・安定配当枠として長期保有を検討する。爆益狙いではなく、NISAの守り枠として使う。",
    expectedScenario: "配当を受け取りながら長期保有する。短期の値動きより、増配継続性や通信インフラとしての安定性を重視する。",
    exitCondition: "減配、長期的な業績悪化、通信政策リスク、140円割れかつ悪材料ありの場合は見直す。",
    takeProfitCondition: "基本は売らない。180円以上まで上がり、比率が大きくなりすぎた場合のみ一部利確を検討する。",
    stopLossCondition: "短期下落では損切りしない。減配や事業悪化が明確になった場合に見直す。",
    emotionTag: "planned"
  },
  "7974.T": {
    reason: "ゲームIPの長期成長枠。ゲーム会社志望として企業研究にもなり、長期で持つ理由が作りやすい。",
    expectedScenario: "新ハード、ソフト販売、IP展開、映画・テーマパーク・グッズ展開が評価され、中長期で成長する。",
    exitCondition: "新ハード販売不振、決算失望、ゲーム機サイクル悪化、7,000円割れかつ悪材料ありの場合は見直す。",
    takeProfitCondition: "9,000円で一部利確を検討。10,000円超えなら強め利確候補。ただし1株は長期保有も検討する。",
    stopLossCondition: "単純な短期下落では損切りしない。業績・IP展開・新ハード見通しが崩れた場合に見直す。",
    emotionTag: "planned"
  },
  "6857.T": {
    reason: "AI半導体テスターの本命級。長期テーマは強いが、1株が高く値動きも荒いため慎重に検討する。",
    expectedScenario: "AI半導体需要が続き、テスター需要も伸びる。35,000円付近まで上昇した場合は一部利確を検討する。",
    exitCondition: "25,000円を割る、AI半導体需要の鈍化、決算失望、半導体装置セクター全体の下落が続く場合は見直す。",
    takeProfitCondition: "35,000円で利確検討。40,000円以上では強めに利確を検討する。",
    stopLossCondition: "25,000円割れで見直し。業績悪化を伴う場合は損切り検討。",
    emotionTag: "planned"
  },
  SP500_FUND: {
    reason: "長期資産形成の土台。個別株の値動きに振り回されすぎないため、NISAで少額から積み立てる。",
    expectedScenario: "米国企業全体の長期成長に乗る。短期利益ではなく、数年単位で資産形成する。",
    exitCondition: "生活費や現金余力が不足する場合、またはポートフォリオ全体の見直しが必要になった場合に確認する。",
    takeProfitCondition: "原則売らない。資金が必要な場合や、比率が大きくなりすぎた場合のみ一部売却を検討する。",
    stopLossCondition: "短期下落では損切りしない。長期積立方針が変わった場合のみ見直す。",
    emotionTag: "planned"
  }
};

const socioNextReview: JournalTemplate = {
  reason: "保有後の値動きや決算・ニュースを確認し、当初の買い理由がまだ残っているか見直すため。",
  expectedScenario: "半導体テーマと業績回復シナリオが維持されていれば継続保有。反発が弱い場合は一部縮小も検討する。",
  exitCondition: "買い理由が崩れている、出来高を伴って下落している、1,700円割れが定着している場合は見直し。",
  takeProfitCondition: "2,400円以上で一部利確。2,700円以上では欲張りすぎず強めに利確を検討。",
  stopLossCondition: "1,650円割れ、または決算・業績見通しが悪化した場合は損切り検討。",
  emotionTag: "calm"
};

const socioNextBuyPlan: JournalTemplate = {
  reason: "決算後に大きく下落し、買いラインに近づいているため。半導体テーマの反発余地はあるが、業績ブレが大きいため短期〜中期のテーマ枠として少額で検討する。",
  expectedScenario: "半導体テーマが継続し、売られすぎから反発する。数週間〜数ヶ月で2,400円付近まで戻る場合は一部利確を検討する。",
  exitCondition: "1,700円を割る、追加の悪材料が出る、次の決算で成長鈍化が確認される、半導体全体の地合いが崩れる場合は見直す。",
  takeProfitCondition: "2,400円で一部利確を検討。2,700円以上なら強めに利確を検討する。",
  stopLossCondition: "1,700円割れで見直し。1,650円割れかつ悪材料ありなら損切りを検討する。",
  emotionTag: "planned"
};

export function getJournalTemplate(
  symbol: string,
  actionType: TradeActionType,
  _accountType: AccountType,
  _investmentHorizon?: InvestmentHorizon,
  _positionPurpose?: PositionPurpose
): JournalTemplate | null {
  if (symbol === "6526.T") {
    return actionType === "REVIEW" ? socioNextReview : socioNextBuyPlan;
  }
  return defaultTemplates[symbol] ?? null;
}
