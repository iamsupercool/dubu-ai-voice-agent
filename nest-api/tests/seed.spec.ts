import { test, expect } from '@playwright/test'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = path.join(__dirname, '..', 'data')
const PASSWORD = '1111'
const USER_COUNT = 10
const CONV_PER_USER = 10
const MIN_MESSAGES = 150
const MAX_MESSAGES = 200

const TOPICS = [
  '공룡 이야기', '우주와 별', '동물의 세계', '재미있는 과학',
  '수학이 쉬워요', '학교 생활', '자연과 환경', '미래 기술',
  '음식과 영양', '운동의 즐거움', '음악과 예술', '날씨와 계절',
  '식물 이야기', '바다의 비밀', '친구와 우정', '독서의 즐거움',
  '지구 이야기', '하늘과 구름', '역사 이야기', 'AI와 로봇',
]

const USER_MSGS = [
  '공룡은 왜 멸종했어요?',
  '우주에 외계인이 있을까요?',
  '가장 큰 동물이 뭐예요?',
  '무지개는 어떻게 생겨요?',
  '별은 왜 반짝여요?',
  '왜 하늘은 파란색이에요?',
  '새는 왜 날 수 있어요?',
  '바다는 왜 짜요?',
  '달은 왜 모양이 바뀌어요?',
  '식물은 어떻게 자라요?',
  '구름은 어떻게 만들어져요?',
  '번개는 왜 쳐요?',
  '눈은 어떻게 만들어져요?',
  '지진은 왜 일어나요?',
  '화산은 어떻게 폭발해요?',
  '로봇은 어떻게 움직여요?',
  '전기는 어떻게 만들어요?',
  '태양은 얼마나 뜨거워요?',
  '빛은 얼마나 빨리 이동해요?',
  '꿈은 왜 꾸는 거예요?',
  '물은 왜 투명해요?',
  '인공지능이 뭐예요?',
  '재활용이 왜 중요해요?',
  '독서가 왜 중요해요?',
  '수학 숙제 도와줄 수 있어요?',
  '오늘 날씨가 왜 이렇게 더워요?',
  '물고기는 어떻게 숨을 쉬어요?',
  '지구는 왜 둥글어요?',
  '음식은 몸에서 어떻게 소화돼요?',
  '불은 어떻게 생겨요?',
  '컴퓨터는 어떻게 작동해요?',
  '음악을 들으면 왜 기분이 좋아져요?',
  '왜 배가 고프면 소리가 나요?',
  '색깔은 어떻게 만들어져요?',
  '미래에는 어떤 기술이 있을까요?',
  '환경 보호를 어떻게 할 수 있어요?',
  '동물을 어떻게 보호할 수 있어요?',
  '친구와 사이좋게 지내는 방법이 있어요?',
  '운동하면 어떤 점이 좋아요?',
  '오늘 학교에서 뭘 배웠는지 알려줄게요',
]

const AI_MSGS = [
  '좋은 질문이에요! 함께 알아볼게요.',
  '공룡은 약 6600만 년 전 운석 충돌로 멸종했어요.',
  '과학자들이 아직 연구하고 있는 흥미로운 질문이에요!',
  '물고기는 아가미로 물속의 산소를 흡수해요.',
  '지구는 중력 때문에 둥근 모양이 되었어요.',
  '현재까지 알려진 가장 큰 동물은 대왕고래예요.',
  '무지개는 빛이 물방울을 통과할 때 굴절되어 생겨요.',
  '별이 반짝이는 건 지구의 대기층 때문이에요.',
  '음식은 소화기관을 거치며 영양소로 분해돼요.',
  '하늘이 파란 이유는 빛의 산란 현상 때문이에요.',
  '새의 뼈는 속이 비어 있어 가볍기 때문에 날 수 있어요.',
  '불은 연료, 산소, 열이 만날 때 생겨요.',
  '바닷물이 짠 이유는 강물이 암석의 소금을 녹여 바다로 가져오기 때문이에요.',
  '달의 모양이 변하는 건 지구에서 보이는 면이 달라지기 때문이에요.',
  '식물은 광합성을 통해 햇빛, 물, 이산화탄소로 자라요.',
  '구름은 작은 물방울이나 얼음 결정이 모여서 만들어져요.',
  '번개는 구름 안에서 전하가 쌓여 방출될 때 생겨요.',
  '눈은 구름 속 물방울이 얼어서 만들어져요.',
  '지진은 지구 내부의 판이 움직일 때 발생해요.',
  '화산은 지구 내부의 마그마가 지표로 나올 때 폭발해요.',
  '로봇은 컴퓨터 프로그램과 모터로 움직여요.',
  '컴퓨터는 0과 1로 이루어진 이진법으로 작동해요.',
  '전기는 발전소에서 코일과 자석을 이용해 만들어요.',
  '태양의 표면 온도는 약 5500도예요!',
  '빛은 1초에 약 30만 킬로미터를 이동해요.',
  '음악은 뇌의 도파민 분비를 촉진시켜 기분을 좋게 해요.',
  '꿈은 수면 중 뇌가 기억을 정리하는 과정에서 나타나요.',
  '배에서 소리가 나는 건 위장이 음식을 소화하려고 움직이기 때문이에요.',
  '물 분자는 빛을 거의 흡수하지 않아서 투명하게 보여요.',
  '색깔은 빛의 파장에 따라 다르게 보여요.',
  '미래에는 AI와 우주여행 기술이 더욱 발전할 거예요.',
  '인공지능은 컴퓨터가 스스로 학습하고 판단하는 기술이에요.',
  '에너지를 아끼고 쓰레기를 줄이는 것이 환경 보호에 도움이 돼요.',
  '재활용은 쓰레기를 줄이고 자원을 아낄 수 있어서 중요해요.',
  '동물을 함부로 잡지 않고 서식지를 보호하는 것이 중요해요.',
  '상대방의 말을 잘 듣고 서로 배려하는 것이 중요해요.',
  '독서는 어휘력과 상상력을 키워주기 때문에 중요해요.',
  '운동은 건강을 유지하고 스트레스를 줄여줘요.',
  '그건 정말 흥미로운 주제네요! 더 자세히 설명해줄게요.',
  '아주 훌륭한 질문이에요! 같이 생각해봐요.',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

interface UserRecord {
  id: string
  username: string
  passwordHash: string
  createdAt: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ConvIndex {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

interface ConvDetail {
  id: string
  title: string
  username: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

test('seed: 계정 10개 + 채팅방 100개 + 메시지 생성', async () => {
  fs.mkdirSync(DATA_DIR, { recursive: true })

  // 1. 기존 users.json 읽기
  const usersPath = path.join(DATA_DIR, 'users.json')
  let allUsers: UserRecord[] = []
  try {
    const raw = fs.readFileSync(usersPath, 'utf-8').trim()
    if (raw) allUsers = JSON.parse(raw)
  } catch {}

  const existingNames = new Set(allUsers.map((u) => u.username))
  const passwordHash = await bcrypt.hash(PASSWORD, 10)
  const now = Date.now()

  // 2. user01~user10 중 없는 계정만 추가
  for (let i = 1; i <= USER_COUNT; i++) {
    const username = `user${String(i).padStart(2, '0')}`
    if (!existingNames.has(username)) {
      allUsers.push({
        id: randomUUID(),
        username,
        passwordHash,
        createdAt: new Date(now - i * 86_400_000).toISOString(),
      })
    }
  }
  fs.writeFileSync(usersPath, JSON.stringify(allUsers, null, 2))

  // 3. seed 계정 목록 추출
  const seedUsernames = new Set(
    Array.from({ length: USER_COUNT }, (_, i) => `user${String(i + 1).padStart(2, '0')}`)
  )
  const seedUsers = allUsers.filter((u) => seedUsernames.has(u.username))

  // 4. 각 유저별 채팅방 생성
  let createdConvs = 0
  for (const user of seedUsers) {
    const convDir = path.join(DATA_DIR, 'conversations', user.id)
    const indexPath = path.join(convDir, 'index.json')

    let index: ConvIndex[] = []
    if (fs.existsSync(indexPath)) {
      try { index = JSON.parse(fs.readFileSync(indexPath, 'utf-8') || '[]') } catch {}
    }
    if (index.length >= CONV_PER_USER) continue

    fs.mkdirSync(convDir, { recursive: true })

    const needed = CONV_PER_USER - index.length
    for (let c = 0; c < needed; c++) {
      const convId = randomUUID()
      const topic = pick(TOPICS)
      const msgCount = randInt(MIN_MESSAGES, MAX_MESSAGES)
      const baseTime = now - randInt(1, 30) * 86_400_000 - c * 3_600_000

      const messages: Message[] = Array.from({ length: msgCount }, (_, m) => ({
        role: (m % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m % 2 === 0 ? pick(USER_MSGS) : pick(AI_MSGS),
        timestamp: new Date(baseTime + m * 30_000).toISOString(),
      }))

      const createdAt = messages[0].timestamp
      const updatedAt = messages[messages.length - 1].timestamp

      const detail: ConvDetail = { id: convId, title: topic, username: user.username, messages, createdAt, updatedAt }
      fs.writeFileSync(path.join(convDir, `${convId}.json`), JSON.stringify(detail, null, 2))

      index.push({ id: convId, title: topic, createdAt, updatedAt, messageCount: messages.length })
      createdConvs++
    }

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2))
    console.log(`  ✓ ${user.username}: 채팅방 ${needed}개 생성`)
  }

  console.log(`\n완료: 채팅방 총 ${createdConvs}개 생성`)
  expect(seedUsers.length).toBe(USER_COUNT)
})
