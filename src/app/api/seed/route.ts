import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'
import { hotScore } from '@/lib/post-helpers'

const PROVINCES = [
  { slug: 'luanda', name: 'Luanda', desc: 'A capital e maior cidade de Angola. Trânsito, custo de vida, emprego, lazer.', icon: 'building-2', color: 'rose' },
  { slug: 'benguela', name: 'Benguela', desc: 'Cidade costeira, ferrovia do Benguela, praias e cultura.', icon: 'waves', color: 'cyan' },
  { slug: 'huambo', name: 'Huambo', desc: 'Planalto central, agricultura, clima ameno e universidades.', icon: 'wheat', color: 'emerald' },
  { slug: 'huila', name: 'Huíla', desc: 'Lubango, Serra da Leba, Tundavala e turismo.', icon: 'mountain', color: 'amber' },
  { slug: 'cabinda', name: 'Cabinda', desc: 'Exclavo petrolífero ao norte, floresta e cultura local.', icon: 'fuel', color: 'orange' },
  { slug: 'namibe', name: 'Namibe', desc: 'Deserto do Namibe, porto do Namibe e pesca.', icon: 'sun', color: 'yellow' },
  { slug: 'malanje', name: 'Malanje', desc: 'Quedas de Kalandula, Pungo Andongo e agricultura.', icon: 'droplets', color: 'blue' },
  { slug: 'uige', name: 'Uíge', desc: 'Norte verde, café, fronteiras e tradições.', icon: 'coffee', color: 'lime' },
  { slug: 'bie', name: 'Bié', desc: 'Centro geográfico, Kuito, agricultura e história.', icon: 'landmark', color: 'fuchsia' },
  { slug: 'moxico', name: 'Moxico', desc: 'Maior província em área, leste angolano e natureza.', icon: 'trees', color: 'green' },
]

const TOPICS = [
  { slug: 'educacao', name: 'Educação', desc: 'Escolas, universidades, exames, bolsas de estudo e dúvidas académicas.', icon: 'graduation-cap', color: 'blue' },
  { slug: 'tecnologia', name: 'Tecnologia', desc: 'Programação, internet, telemóveis, inovação e startups em Angola.', icon: 'cpu', color: 'rose' },
  { slug: 'saude', name: 'Saúde', desc: 'Hospitais, postos de saúde, doenças e bem-estar.', icon: 'heart-pulse', color: 'red' },
  { slug: 'emprego', name: 'Emprego & Carreira', desc: 'Vagas, currículos, entrevistas e empreendedorismo.', icon: 'briefcase', color: 'amber' },
  { slug: 'negocios', name: 'Negócios & Kwanza', desc: 'Empreender, impostos, comércio e finanças em Angola.', icon: 'trending-up', color: 'emerald' },
  { slug: 'direito', name: 'Direito & Cidadania', desc: 'Documentos, registo civil, leis angolanas e direitos.', icon: 'scale', color: 'violet' },
  { slug: 'cultura', name: 'Cultura & Tradições', desc: 'Línguas nacionais, gastronomia, música e costumes.', icon: 'music', color: 'fuchsia' },
  { slug: 'desporto', name: 'Desporto', desc: 'Girabola, futebol, basquetebol e atletas angolanos.', icon: 'trophy', color: 'orange' },
  { slug: 'turismo', name: 'Turismo & Viagens', desc: 'Onde visitar, hotéis, voos TAAG e roteiros em Angola.', icon: 'plane', color: 'cyan' },
  { slug: 'agricultura', name: 'Agricultura', desc: 'Fazendas, criação de gado, mercados e cooperativas.', icon: 'sprout', color: 'lime' },
]

const SAMPLE = [
  { c: 'tecnologia', type: 'question', title: 'Qual a melhor operadora de internet em Luanda para trabalhar remoto?', body: 'Pessoal, estou a começar a trabalhar remoto e a minha internet Unitel cai muito. Alguém usa a Africell ou NetOne? Vale a pena o NetHome/TV Cabo? Quero algo estável para videochamadas.', author: 'joao_tech', tags: ['internet', 'luanda', 'remoto'], comments: [
    { body: 'Eu uso a TV Cabo (Zap) a 100Mbps e aguenta bem Zoom e Slack. Custo ~25.000 Kz/mês. Já a Unitel móvel para trabalho é sofrível.', author: 'ana_dev', votes: 12, answer: true },
    { body: 'Africell tem bom preço mas a cobertura fora de Luanda deixa a desejar. Para remoto, vai pela TV Cabo ou MSTV.', author: 'carlos_it', votes: 5 },
    { body: 'Concordo com a Ana. E evita a Unitel nos horários de pico (18h-22h).', author: 'manuel_net', votes: 3 },
  ]},
  { c: 'educacao', type: 'question', title: 'Como funciona o processo de equivalência do 12º ano angolano em Portugal?', body: 'Terminei o 12º ano em Angola e quero candidatar-me a uma universidade em Portugal. Alguém passou por esse processo de equivalência? Que documentos levar à Embaixada?', author: 'maria_estudante', tags: ['universidade', 'portugal', 'equivalencia'], comments: [
    { body: 'Precisas do certificado de habilitações autenticado pelo Ministério da Educação (REAB - Reconhecimento de habilitações). Depois na embaixada fazes a legalização. Em Portugal, a DGES trata da equivalência. Dica: começa cedo, demora 2-3 meses.', author: 'professor_jose', votes: 18, answer: true },
  ]},
  { c: 'luanda', type: 'discussion', title: 'O trânsito da Marginal de Luanda está insuportável — alternativas?', body: 'Hoje demorei 2h da Maianga até Talatona. Que rotas vocês usam para fugir do pico? A via expressa vale a pena?', author: 'pedro_motorista', tags: ['transito', 'luanda'], comments: [
    { body: 'Saio de casa às 5h30 ou depois das 9h. Não há milagre em Luanda.', author: 'rita_luanda', votes: 9 },
    { body: 'A via expressa Clássicos-Talatona ajuda bastante se vieres do centro. Evita a Av. Deolinda Rodrigues no pico.', author: 'eduardo_road', votes: 6 },
  ]},
  { c: 'negocios', type: 'question', title: 'Como abrir um conta no BFA sendo estudante universitário?', body: 'Quero abrir uma conta bancária para receber pagamentos de freelance. Que documentos preciso? Tem alguma taxa mensal para estudantes?', author: 'sofia_freelancer', tags: ['banco', 'bfa', 'estudante'], comments: [
    { body: 'BFA Jovem: BI + comprovativo de estudante + 1 foto + depósito mínimo (costuma ser 5.000 Kz). Sem quota mensal para menores de 25 com saldo mínimo. Leva também o NIF.', author: 'gerente_banco', votes: 14, answer: true },
  ]},
  { c: 'cultura', type: 'discussion', title: 'Quais as melhores músicas kizomba e semba para começar a ouvir?', body: 'Sou da diáspora e quero redescobrir a música angolana. Recomendem artistas e músicas essenciais de kizomba e semba.', author: 'diaspora_ana', tags: ['musica', 'kizomba', 'semba'], comments: [
    { body: 'Semba: Paulo Flores, Bonga, Carlos Burity. Kizomba: Eduardo Paim, Matias Damásio, C4 Pedro. Começa pelo álbum "Muxima" do Bonga.', author: 'dj_musica', votes: 22, answer: true },
    { body: 'Não te esqueças do kuduro! Os Lambas, Nacobana e Battery 1 fazem parte da história.', author: 'kuduro_fan', votes: 8 },
  ]},
  { c: 'saude', type: 'question', title: 'Onde fazer teste de COVID/gripe em Luanda de forma fiável?', body: 'Estou com sintomas e preciso de um teste fiável para viajar. Clínicas recomendadas com preço acessível?', author: 'joana_saude', tags: ['covid', 'clinicas', 'luanda'], comments: [
    { body: 'Clínica Sagrada Esperança e Clínica Girassol fazem testes rápidos e PCR. PCR ~25.000 Kz, rápido ~3.000 Kz. Resultados em 24h.', author: 'enfermeiro_paulo', votes: 7, answer: true },
  ]},
  { c: 'desporto', type: 'discussion', title: 'Petro de Luanda vs 1º de Agosto: quem ganha o Girabola 2025?', body: 'O dérbi está a aproximar-se. As vossas previsões? O Petro tem estado forte em casa.', author: 'futebol_angelo', tags: ['girabola', 'petro', '1agosto'], comments: [
    { body: 'Petro em casa é sempre favorito, mas o 1º de Agosto tem o melhor ataque da temporada. Vou num empate 1-1.', author: 'adepto_neutro', votes: 11 },
    { body: 'Petro 2-1. O Estadio 11 de Novembro é uma fortaleza.', author: 'petrista', votes: 6 },
  ]},
  { c: 'emprego', type: 'question', title: 'Como montar um currículo para empresas petrolíferas (Sonangol/Total)?', body: 'Sou engenheiro de petróleo recém-licenciado. Que formato de CV preferem? Vale a pena candidatar-me online ou melhor indicação?', author: 'eng_petroleo', tags: ['cv', 'petroleo', 'sonangol'], comments: [
    { body: 'CV em português e inglês, máximo 2 páginas, com formação académica, estágios (mesmo académicos), software (Petrel, Eclipse) e idiomas. Sonangol publica concursos no site oficial e na imprensa. Total recruta via LinkedIn também. Indicação ajuda, mas não substitui um bom CV.', author: 'rh_oilgas', votes: 16, answer: true },
  ]},
  { c: 'turismo', type: 'discussion', title: 'Roteiro de 5 dias no Namibe: o que não perder?', body: 'Vou ao Namibe em Janeiro. Quero ver o deserto, as Welwitschias e as praias. Onde ficar e como organizar?', author: 'viajante_dino', tags: ['namibe', 'deserto', 'roteiro'], comments: [
    { body: 'Base em Moçâmedes. Dia 1: cidade e praia das Miragens. Dia 2: Parque Nacional do Namibe (Welwitschia). Dia 3: dunas de Curoca. Dia 4: Porto do Namibe e pesca. Dia 5: Tombwa. Contrata guia local — estradas difíceis.', author: 'guia_namibe', votes: 19, answer: true },
  ]},
  { c: 'direito', type: 'question', title: 'Como renovar o Bilhete de Identidade vencido em 2025?', body: 'O meu BI vence em 2 meses. Onde ir em Luanda e que documentos levar? Posso agendar online?', author: 'cidadao_bento', tags: ['bi', 'documentos', 'identificacao'], comments: [
    { body: 'Nos balcões do SEPIA em Luanda (Maianga, Talatona, Cazenga). Leva o BI antigo, comprovativo de morada e 2 fotos. Agendamento via portal do Ministério da Justiça. Em 2025 já emitem o BI electrónico.', author: 'jurista_marta', votes: 13, answer: true },
  ]},
  { c: 'agricultura', type: 'question', title: 'Melhor época para plantar mandioca no Huambo?', body: 'Tenho uma pequena machamba no Huambo e quero investir em mandioca. Quando plantar e que variedades resistem à seca?', author: 'agricultor_tony', tags: ['mandioca', 'huambo', 'seca'], comments: [
    { body: 'Planta no início das chuvas (Setembro-Outubro). Variedades resistentes: TMS 30572, ICA. O Huambo tem 2 épocas: grande (Out-Mar) e seca. Mandioca aguenta seca mas precisa de boa drenagem.', author: 'engenheiro_agronomo', votes: 10, answer: true },
  ]},
  { c: 'tecnologia', type: 'discussion', title: 'Melhor app de pagamentos MB WAY/multicaixa Express em Angola?', body: 'Preciso de enviar dinheiro e pagar serviços pelo telemóvel. Unitel Money vs Multicaixa Express vs Africell Money?', author: 'pagamentos_lu', tags: ['mobile-money', 'pagamentos'], comments: [
    { body: 'Multicaixa Express é o padrão nacional, aceita em quase todo o lado. Para transferências P2P, Unitel Money tem mais agentes. Africell Money tem promoções mas menos cobertura.', author: 'fintech_zito', votes: 15, answer: true },
  ]},
]

const BADGES = [
  { key: 'novato', name: 'Novato', description: 'Criou a sua conta no AjudaAí', icon: 'sparkles', color: 'amber' },
  { key: 'perguntador', name: 'Curioso', description: 'Fez 5 perguntas', icon: 'help-circle', color: 'cyan' },
  { key: 'helper', name: 'Ajudante', description: 'Respondeu 10 vezes', icon: 'life-buoy', color: 'emerald' },
  { key: 'top-answer', name: 'Sábio', description: 'Teve uma resposta escolhida como melhor', icon: 'crown', color: 'amber' },
  { key: 'votado', name: 'Popular', description: 'Recebeu 50 votos positivos', icon: 'flame', color: 'rose' },
  { key: 'veterano', name: 'Veterano', description: 'Membro há mais de 7 dias ativo', icon: 'shield', color: 'violet' },
]

const SEED_USERS = [
  { username: 'joao_tech', displayName: 'João Tech', email: 'joao@ajudai.ao', location: 'Luanda', color: 'rose', bio: 'Desenvolvedor em Luanda. Apaixonado por open source e café.' },
  { username: 'ana_dev', displayName: 'Ana Domingues', email: 'ana@ajudai.ao', location: 'Luanda', color: 'amber', bio: 'Full-stack developer. Ajudo no que puder em tech.' },
  { username: 'carlos_it', displayName: 'Carlos IT', email: 'carlos@ajudai.ao', location: 'Benguela', color: 'cyan', bio: 'Sysadmin e network engineer.' },
  { username: 'maria_estudante', displayName: 'Maria António', email: 'maria@ajudai.ao', location: 'Huambo', color: 'emerald', bio: 'Estudante do 12º ano. Quero ir para a universidade.' },
  { username: 'professor_jose', displayName: 'Prof. José', email: 'jose@ajudai.ao', location: 'Luanda', color: 'violet', bio: 'Professor de matemática há 15 anos.' },
  { username: 'pedro_motorista', displayName: 'Pedro Bumba', email: 'pedro@ajudai.ao', location: 'Luanda', color: 'orange', bio: 'Motorista de aplicativo em Luanda.' },
  { username: 'rita_luanda', displayName: 'Rita Cabral', email: 'rita@ajudai.ao', location: 'Luanda', color: 'fuchsia', bio: 'Luandense de gema.' },
  { username: 'sofia_freelancer', displayName: 'Sofia Manuel', email: 'sofia@ajudai.ao', location: 'Talatona', color: 'rose', bio: 'Designer freelance.' },
  { username: 'gerente_banco', displayName: 'Eduardo BFA', email: 'eduardo@ajudai.ao', location: 'Luanda', color: 'lime', bio: 'Trabalho no setor bancário angolano.' },
  { username: 'diaspora_ana', displayName: 'Ana Diáspora', email: 'anadiaspora@ajudai.ao', location: 'Portugal', color: 'cyan', bio: 'Angolana em Portugal.' },
  { username: 'dj_musica', displayName: 'DJ Kizomba', email: 'dj@ajudai.ao', location: 'Luanda', color: 'fuchsia', bio: 'DJ e produtor musical.' },
  { username: 'joana_saude', displayName: 'Joana Saúde', email: 'joana@ajudai.ao', location: 'Luanda', color: 'red', bio: 'Enfermeira do Hospital Josina Machel.' },
  { username: 'enfermeiro_paulo', displayName: 'Enf. Paulo', email: 'paulo@ajudai.ao', location: 'Luanda', color: 'red', bio: 'Enfermeiro. Saúde pública.' },
  { username: 'futebol_angelo', displayName: 'Angelo Petro', email: 'angelo@ajudai.ao', location: 'Luanda', color: 'rose', bio: 'Adepto do Petro. Futebol é religião.' },
  { username: 'adepto_neutro', displayName: 'Neutro Futebol', email: 'neutro@ajudai.ao', location: 'Huambo', color: 'amber', bio: 'Gosto de futebol mas sem clube fixo.' },
  { username: 'petrista', displayName: 'Petro Forever', email: 'petrista@ajudai.ao', location: 'Luanda', color: 'rose', bio: 'Petro de Luanda até à morte.' },
  { username: 'eng_petroleo', displayName: 'Eng. oil&gas', email: 'eng@ajudai.ao', location: 'Cabinda', color: 'orange', bio: 'Engenheiro de petróleo.' },
  { username: 'rh_oilgas', displayName: 'RH Oil&Gas', email: 'rh@ajudai.ao', location: 'Luanda', color: 'amber', bio: 'Recursos Humanos no setor petrolífero.' },
  { username: 'viajante_dino', displayName: 'Dino Viajante', email: 'dino@ajudai.ao', location: 'Namibe', color: 'cyan', bio: 'Viajante e fotógrafo.' },
  { username: 'guia_namibe', displayName: 'Guia do Namibe', email: 'guia@ajudai.ao', location: 'Namibe', color: 'amber', bio: 'Guia turístico no sul de Angola.' },
  { username: 'cidadao_bento', displayName: 'Bento Cidadão', email: 'bento@ajudai.ao', location: 'Cazenga', color: 'blue', bio: 'Cidadão preocupado com os seus documentos.' },
  { username: 'jurista_marta', displayName: 'Dra. Marta', email: 'marta@ajudai.ao', location: 'Luanda', color: 'violet', bio: 'Jurista. Direito administrativo.' },
  { username: 'agricultor_tony', displayName: 'Tony Agricultor', email: 'tony@ajudai.ao', location: 'Huambo', color: 'lime', bio: 'Agricultor no planalto central.' },
  { username: 'engenheiro_agronomo', displayName: 'Eng. Agrónomo', email: 'agronomo@ajudai.ao', location: 'Huambo', color: 'emerald', bio: 'Engenheiro agrónomo. Pesquisa e extensão rural.' },
  { username: 'pagamentos_lu', displayName: 'Zito Fintech', email: 'zito@ajudai.ao', location: 'Luanda', color: 'rose', bio: 'Entusiasta de fintech e pagamentos.' },
  { username: 'fintech_zito', displayName: 'Zito Fintech', email: 'zito2@ajudai.ao', location: 'Luanda', color: 'rose', bio: 'Trabalho com pagamentos digitais.' },
  { username: 'manuel_net', displayName: 'Manuel Net', email: 'manuel@ajudai.ao', location: 'Luanda', color: 'cyan', bio: 'Técnico de redes.' },
  { username: 'eduardo_road', displayName: 'Eduardo Road', email: 'eduardo.road@ajudai.ao', location: 'Luanda', color: 'orange', bio: 'Conheço Luanda de trás para a frente.' },
  { username: 'kuduro_fan', displayName: 'Kuduro Fan', email: 'kuduro@ajudai.ao', location: 'Luanda', color: 'fuchsia', bio: 'Kuduro até à morte!' },
]

export async function POST(req: NextRequest) {
  const force = new URL(req.url).searchParams.get('force') === '1'

  // Only allow seeding if DB is empty, unless ?force=1
  const count = await db.community.count()
  if (count > 0 && !force) {
    return NextResponse.json({ seeded: false, message: 'Base de dados já contém comunidades. Usa ?force=1 para reiniciar.' })
  }

  if (force && count > 0) {
    // wipe everything (order matters for FKs)
    await db.userBadge.deleteMany()
    await db.badge.deleteMany()
    await db.notification.deleteMany()
    await db.postTag.deleteMany()
    await db.tag.deleteMany()
    await db.vote.deleteMany()
    await db.comment.deleteMany()
    await db.post.deleteMany()
    await db.membership.deleteMany()
    await db.community.deleteMany()
    await db.session.deleteMany()
    await db.user.deleteMany()
  }

  // badges
  for (const b of BADGES) {
    await db.badge.upsert({ where: { key: b.key }, update: {}, create: b })
  }

  // communities
  const allCommunities = [...PROVINCES, ...TOPICS].map((c) => ({ ...c, category: PROVINCES.includes(c as any) ? 'Província' : 'Tópico' }))
  for (const c of allCommunities) {
    await db.community.create({ data: { slug: c.slug, name: c.name, description: c.desc, icon: c.icon, color: c.color, category: c.category } })
  }

  // users
  const userMap: Record<string, string> = {}
  for (const u of SEED_USERS) {
    const created = await db.user.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash: await hashPassword('ajudai123'),
        displayName: u.displayName,
        location: u.location,
        avatarColor: u.color,
        bio: u.bio,
        karma: Math.floor(Math.random() * 80) + 5,
      },
    })
    userMap[u.username] = created.id
    // welcome + novato badge
    const novato = await db.badge.findUnique({ where: { key: 'novato' } })
    if (novato) await db.userBadge.create({ data: { userId: created.id, badgeId: novato.id } }).catch(() => null)
  }

  // memberships (random joins)
  const communities = await db.community.findMany()
  for (const uname of Object.keys(userMap)) {
    const uid = userMap[uname]
    const joinCount = 3 + Math.floor(Math.random() * 5)
    const shuffled = [...communities].sort(() => Math.random() - 0.5).slice(0, joinCount)
    for (const c of shuffled) {
      await db.membership.create({ data: { userId: uid, communityId: c.id } }).catch(() => null)
    }
  }
  // update member counts
  for (const c of communities) {
    const n = await db.membership.count({ where: { communityId: c.id } })
    await db.community.update({ where: { id: c.id }, data: { members: n + Math.floor(Math.random() * 50) } })
  }

  // sample posts + comments
  for (const s of SAMPLE) {
    const community = communities.find((c) => c.slug === s.c)
    const authorId = userMap[s.author]
    if (!community || !authorId) continue
    const post = await db.post.create({
      data: {
        type: s.type,
        title: s.title,
        body: s.body,
        communityId: community.id,
        authorId,
        upvotes: 5 + Math.floor(Math.random() * 40),
        downvotes: Math.floor(Math.random() * 3),
        views: 50 + Math.floor(Math.random() * 400),
        answerCount: s.comments.length,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 7)),
      },
    })
    // recompute score
    const score = post.upvotes - post.downvotes
    await db.post.update({ where: { id: post.id }, data: { score, hotScore: hotScore(score, post.createdAt) } })

    // tags
    for (const t of s.tags || []) {
      const tag = await db.tag.upsert({ where: { name: t }, update: {}, create: { name: t } })
      await db.postTag.create({ data: { postId: post.id, tagId: tag.id } }).catch(() => null)
    }

    // comments
    for (const cm of s.comments) {
      const cAuthor = userMap[cm.author]
      if (!cAuthor) continue
      const created = await db.comment.create({
        data: {
          body: cm.body,
          postId: post.id,
          authorId: cAuthor,
          upvotes: cm.votes,
          downvotes: 0,
          score: cm.votes,
          isAnswer: !!cm.answer,
          createdAt: new Date(post.createdAt.getTime() + Math.floor(Math.random() * 1000 * 60 * 60 * 6)),
        },
      })
      if (cm.answer) {
        // award sábio badge
        const top = await db.badge.findUnique({ where: { key: 'top-answer' } })
        if (top) await db.userBadge.create({ data: { userId: cAuthor, badgeId: top.id } }).catch(() => null)
        await db.user.update({ where: { id: cAuthor }, data: { karma: { increment: 15 } } })
      }
      // award helper badge after enough answers (approximation)
    }
  }

  // award helper badge to users with many comments
  const helperBadge = await db.badge.findUnique({ where: { key: 'helper' } })
  if (helperBadge) {
    const users = await db.user.findMany({ select: { id: true, _count: { select: { comments: true } } } })
    for (const u of users) {
      if (u._count.comments >= 1) {
        await db.userBadge.create({ data: { userId: u.id, badgeId: helperBadge.id } }).catch(() => null)
      }
    }
  }

  // optionally log in the demo user (joao_tech) if requested
  const { login } = await req.json().catch(() => ({ login: false }))
  if (login && userMap['joao_tech']) {
    const token = await createSession(userMap['joao_tech'])
    await setSessionCookie(token)
  }

  return NextResponse.json({ seeded: true, communities: allCommunities.length, users: SEED_USERS.length, posts: SAMPLE.length })
}
