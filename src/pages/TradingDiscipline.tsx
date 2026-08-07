import {
  Alert,
  Box,
  ButtonBase,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'

const TOC = [
  { id: 'flow', label: '看盘流程' },
  { id: 'structure', label: 'K 线与结构' },
  { id: 'indicators', label: '技术指标' },
  { id: 'recipes', label: '指标配方' },
  { id: 'anti-patterns', label: '组合禁忌' },
  { id: 'regime', label: '市场状态' },
  { id: 'perp', label: '保证金与资金费' },
  { id: 'leverage', label: '杠杆与品种' },
  { id: 'execution', label: '执行与出场' },
  { id: 'events', label: '时间与事件' },
  { id: 'failures', label: '翻车场景' },
  { id: 'vigil', label: '与 Vigil 联动' },
  { id: 'rules', label: '交易纪律' },
  { id: 'pre-trade', label: '开仓前检查' },
  { id: 'post-trade', label: '复盘与日志' },
] as const

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <Stack
      id={id}
      component="section"
      sx={{ gap: 1.5, scrollMarginTop: { xs: 72, md: 88 } }}
    >
      <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: 'surface.subtle',
        borderColor: 'surface.border',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {label}
      </Typography>
    </Paper>
  )
}

function FlowCard({
  step,
  title,
  body,
}: {
  step: string
  title: string
  body: string
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'surface.border', height: '100%' }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
        <Chip size="small" label={step} sx={{ bgcolor: 'surface.subtle' }} />
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {body}
      </Typography>
    </Paper>
  )
}

function RecipeCard({
  title,
  lines,
}: {
  title: string
  lines: { label: string; text: string }[]
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'surface.border', height: '100%' }}
    >
      <Typography sx={{ fontWeight: 600, mb: 1.25 }}>{title}</Typography>
      <Stack sx={{ gap: 1 }}>
        {lines.map((line) => (
          <Typography key={line.label} variant="body2" color="text.secondary">
            <Box
              component="span"
              sx={{ color: 'text.primary', fontWeight: 500 }}
            >
              {line.label}
            </Box>
            {line.text}
          </Typography>
        ))}
      </Stack>
    </Paper>
  )
}

function RuleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderColor: 'surface.border', height: '100%' }}
    >
      <Typography sx={{ fontWeight: 600, mb: 1.25 }}>{title}</Typography>
      <Stack sx={{ gap: 1 }}>
        {items.map((item) => (
          <Typography key={item} variant="body2" color="text.secondary">
            {item}
          </Typography>
        ))}
      </Stack>
    </Paper>
  )
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderColor: 'surface.border' }}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {headers.map((h) => (
              <TableCell
                key={h}
                sx={{ fontWeight: 600, bgcolor: 'surface.subtle' }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell
                  key={j}
                  sx={{
                    color: j === 0 ? 'text.primary' : 'text.secondary',
                    fontWeight: j === 0 ? 500 : 400,
                    verticalAlign: 'top',
                    maxWidth: j === 0 ? 160 : undefined,
                  }}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function TableOfContents({ activeId }: { activeId: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderColor: 'surface.border',
        bgcolor: 'background.paper',
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ px: 1, mb: 0.5, display: 'block', fontWeight: 600 }}
      >
        目录
      </Typography>
      <Stack sx={{ gap: 0.25 }}>
        {TOC.map((item) => {
          const active = item.id === activeId
          return (
            <ButtonBase
              key={item.id}
              onClick={() => scrollToId(item.id)}
              sx={{
                display: 'block',
                textAlign: 'left',
                px: 1,
                py: 0.75,
                borderRadius: 1,
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'surface.subtle' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: 13,
                lineHeight: 1.35,
                borderLeft: '2px solid',
                borderColor: active ? 'primary.main' : 'transparent',
                '&:hover': { bgcolor: 'surface.subtle', color: 'text.primary' },
              }}
            >
              {item.label}
            </ButtonBase>
          )
        })}
      </Stack>
    </Paper>
  )
}

function MobileToc({ activeId }: { activeId: string }) {
  return (
    <Box
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'sticky',
        top: 56,
        zIndex: 2,
        mx: -2,
        px: 2,
        py: 1,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'surface.border',
      }}
    >
      <Stack
        direction="row"
        sx={{
          gap: 1,
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'thin',
        }}
      >
        {TOC.map((item) => (
          <Chip
            key={item.id}
            size="small"
            label={item.label}
            onClick={() => scrollToId(item.id)}
            color={item.id === activeId ? 'primary' : 'default'}
            variant={item.id === activeId ? 'filled' : 'outlined'}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Stack>
    </Box>
  )
}

/**
 * Chart-reading and risk rules as a readable board with in-page TOC —
 * same content as docs/trading-discipline.zh.md.
 */
export default function TradingDiscipline() {
  const [activeId, setActiveId] = useState<string>(TOC[0].id)

  useEffect(() => {
    const nodes = TOC.map((item) => document.getElementById(item.id)).filter(
      (el): el is HTMLElement => el != null,
    )
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        // Offset for the app bar + sticky mobile toc so the section under
        // the fold counts as active, not the one still peeking at the top.
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.25, 0.5],
      },
    )

    for (const node of nodes) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto' }}>
      <MobileToc activeId={activeId} />

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '200px minmax(0, 1fr)' },
          alignItems: 'start',
          mt: { xs: 1.5, md: 0 },
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'sticky',
            top: 88,
            maxHeight: 'calc(100vh - 104px)',
            overflowY: 'auto',
          }}
        >
          <TableOfContents activeId={activeId} />
        </Box>

        <Stack sx={{ gap: 3, minWidth: 0 }}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              交易看盘技巧与纪律
            </Typography>
            <Typography color="text.secondary">
              通用盯盘框架：价格结构定方向，技术指标做确认与过滤，纪律管仓位与行为。左侧目录可跳转各节。
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr 1fr',
                sm: 'repeat(4, 1fr)',
              },
            }}
          >
            <StatCard value="结构优先" label="看盘顺序" />
            <StatCard value="1%–2%" label="单笔风险（硬顶~3%）" />
            <StatCard value="多源确认" label="入场门槛" />
            <StatCard value="空仓合法" label="默认状态" />
          </Box>

          <Alert severity="warning" variant="outlined">
            指标是同一价格的不同投影，堆再多同类指标不会提高胜率。有效组合 =
            趋势/结构 + 动量 +
            波动或成交量，且彼此回答不同问题。合约上更常踩坑的是：把杠杆/保证金占用当成「风险」——真正的风险是止损打掉时账户亏多少。
          </Alert>

          <Section id="flow" title="看盘流程">
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <FlowCard
                step="1"
                title="先定结构"
                body="日线 / 4H 看趋势、摆动高低与关键位；15m–5m 只负责入场时机。大周期无方向时，小周期全是噪音。"
              />
              <FlowCard
                step="2"
                title="指标做确认"
                body="用均线/MACD 对齐趋势，用 RSI/KD 看是否过热或背离，用布林/ATR 估波动与止损宽度——不要用指标「预测」方向。"
              />
              <FlowCard
                step="3"
                title="量能与盘口"
                body="成交量、VWAP、持仓量（合约）回答「有没有人跟」。无量突破、价涨持仓降，优先当假动作。"
              />
              <FlowCard
                step="4"
                title="等交叉再动手"
                body="至少两类独立证据同向：例如结构突破 + 放量，或回踩均线 + RSI 离开超卖且 MACD 柱转正。单指标亮灯不够。"
              />
            </Box>
          </Section>

          <Divider />

          <Section id="structure" title="K 线与结构技巧">
            <SimpleTable
              headers={['主题', '要点']}
              rows={[
                [
                  '多周期对齐',
                  '只在大周期方向上找顺势单；逆势最多做反弹/回踩短线，仓位减半。',
                ],
                [
                  '关键位优先',
                  '前高前低、整点、日/周开盘、成交密集区。没有明确失效位，就不该开仓。',
                ],
                [
                  '假突破识别',
                  '突破瞬间量能不足、长影线拒绝、收盘未能站稳——优先当假突破。',
                ],
                [
                  '波动扩张 vs 压缩',
                  '窄幅盘整后的第一根放量 K 更有信息量；剧烈波动后追单胜率差。',
                ],
                [
                  '影线与收盘',
                  '看收盘相对实体，不看盘中极值。长影线是拒绝，收盘站稳才是接受。',
                ],
                [
                  '相对强弱',
                  '同板块选领先/落后：大盘弱时仍强的品种更值得做多，反之亦然。',
                ],
              ]}
            />
          </Section>

          <Section id="indicators" title="常用技术指标：各自回答什么">
            <Typography variant="body2" color="text.secondary">
              先按「角色」选指标，再谈参数。同类指标（如 RSI 与
              Stochastic）同时用几乎等于重复计数。
            </Typography>
            <SimpleTable
              headers={['角色', '常见工具', '怎么用 / 别怎么用']}
              rows={[
                [
                  '趋势与位置',
                  'MA / EMA（20·50·200）、Ichimoku、VWAP',
                  '价格在均线上方且均线多头排列 → 偏多；回踩不破再做。别用均线金叉当唯一入场。',
                ],
                [
                  '动量',
                  'MACD、RSI、ROC、Stochastic',
                  '看方向与背离：价格新高而 RSI/MACD 不过新高 → 动能衰竭。别在趋势中段死磕超买超卖。',
                ],
                [
                  '波动与通道',
                  '布林带、Keltner、ATR、Donchian',
                  '带宽收窄后突破常跟趋势段；ATR 定止损宽度。别在带宽已极大时追穿轨。',
                ],
                [
                  '成交量',
                  '成交量、OBV、VWAP、成交量分布',
                  '突破需放量确认；缩量回踩健康。价量背离要提高警惕。',
                ],
                [
                  '结构辅助',
                  '斐波那契回撤/扩展、Pivot、水平供需',
                  '回撤位与前高前低重合时权重更高。斐波那契单独不成系统。',
                ],
                [
                  '合约专属（可选）',
                  '资金费率、多空比、持仓量、基差',
                  '极端费率/拥挤仓位常是反向线索；价涨+持仓增才像新趋势。',
                ],
              ]}
            />
          </Section>

          <Section id="recipes" title="指标组合：可直接套用的配方">
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <RecipeCard
                title="顺势回踩（趋势市）"
                lines={[
                  {
                    label: '条件：',
                    text: '价格在 EMA20/50 之上（或之下做空），大周期 MACD 柱同向。',
                  },
                  {
                    label: '入场：',
                    text: '回踩 EMA20 或布林中轨，RSI 从超卖区（多）回升且未破前低。',
                  },
                  {
                    label: '过滤：',
                    text: '成交量回踩萎缩、再启动放量；ATR 正常未极端放大。',
                  },
                  {
                    label: '失效：',
                    text: '收盘跌破回踩均线或前摆动低点。',
                  },
                ]}
              />
              <RecipeCard
                title="突破接力（压缩后）"
                lines={[
                  {
                    label: '条件：',
                    text: '布林带宽或 ATR 处于近期低位（波动压缩）。',
                  },
                  {
                    label: '入场：',
                    text: '收盘突破箱体/Donchian/前高，且成交量明显放大。',
                  },
                  {
                    label: '确认：',
                    text: 'MACD 柱翻向突破方向，或价格站稳 VWAP/突破均线一侧。',
                  },
                  {
                    label: '失效：',
                    text: '长影刺破后收回箱内，或突破后量能迅速枯竭。',
                  },
                ]}
              />
              <RecipeCard
                title="背离反转（震荡/末端）"
                lines={[
                  {
                    label: '条件：',
                    text: '大周期已横盘或趋势斜率变缓，非单边强趋势中段。',
                  },
                  {
                    label: '信号：',
                    text: '价格创新高/低，RSI 或 MACD 未跟创新高/低（背离）。',
                  },
                  {
                    label: '入场：',
                    text: '等结构确认——破短期趋势线或收复关键 K 线，而不是背离一出现就开仓。',
                  },
                  {
                    label: '注意：',
                    text: '强趋势里背离可连续多次，仓位要小、止损要紧。',
                  },
                ]}
              />
              <RecipeCard
                title="均值回归（区间市）"
                lines={[
                  {
                    label: '条件：',
                    text: '价格在明确高低区间震荡，ADX/均线纠缠、无清晰趋势。',
                  },
                  {
                    label: '入场：',
                    text: '触及布林上/下轨或区间边界，RSI 进入超买/超卖并出现拒绝 K。',
                  },
                  {
                    label: '目标：',
                    text: '中轨或区间对侧；勿把震荡策略用在刚突破后的趋势日。',
                  },
                  {
                    label: '切换：',
                    text: '一旦收盘有效突破区间 + 放量，立刻停用回归思路。',
                  },
                ]}
              />
            </Box>
          </Section>

          <Section id="anti-patterns" title="组合禁忌与优先级">
            <SimpleTable
              headers={['做法', '评价', '更好的替代']}
              rows={[
                [
                  'RSI + Stochastic + CCI 同时看',
                  '弱：三者都是动量，高度相关',
                  '留一个动量，再加趋势与成交量',
                ],
                [
                  '只看 MACD 金叉就开仓',
                  '弱：滞后，震荡市反复假信号',
                  '金叉 + 价格在关键均线一侧 + 结构位',
                ],
                [
                  '布林上下轨当绝对买卖点',
                  '弱：趋势市会沿上轨/下轨奔跑',
                  '先判断趋势/震荡，再决定碰轨是反转还是顺势',
                ],
                [
                  '指标参数天天调优',
                  '弱：过拟合近期行情',
                  '固定一小套参数，用多周期与结构过滤',
                ],
                [
                  '小周期指标对抗大周期趋势',
                  '弱：胜率与盈亏比通常双差',
                  '大周期定方向，小周期只找入场',
                ],
              ]}
            />
            <Alert severity="info" variant="outlined">
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                推荐「够用」的最小指标组
              </Typography>
              主图：EMA20 + EMA50（或 VWAP）+ 成交量。副图：MACD 或 RSI
              二选一。波动：ATR
              用于止损。需要时再临时加布林带看压缩/扩张。合约可叠加持仓量与资金费率作过滤器。
            </Alert>
          </Section>

          <Divider />

          <Section id="regime" title="市场状态：先选策略，再选指标">
            <Typography variant="body2" color="text.secondary">
              同一套指标在不同状态下胜率差很多。开盘先看「现在是什么局」，再决定用顺势、突破还是回归。
            </Typography>
            <SimpleTable
              headers={['状态', '怎么认', '适合', '别用']}
              rows={[
                [
                  '趋势',
                  '高低点抬高/降低，价格沿均线一侧走，ADX 偏高或带宽扩张',
                  '顺势回踩、突破接力、移动止损',
                  '摸顶抄底、均值回归',
                ],
                [
                  '震荡',
                  '区间清晰、均线纠缠、假突破多',
                  '区间边界反转、小仓快进快出',
                  '追突破、宽止损扛单',
                ],
                [
                  '无序/chop',
                  '上下影线长、方向反复、量能无配合',
                  '空仓或极小仓试探',
                  '任何需要「干净趋势」的系统',
                ],
                [
                  '极端波动',
                  'ATR 暴增、强平潮、点差拉宽、插针',
                  '减仓、只管理已有仓、等波动回落',
                  '新开大仓、改止损到更远',
                ],
              ]}
            />
          </Section>

          <Section id="perp" title="合约专属：保证金、爆仓、资金费">
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              }}
            >
              <RuleCard
                title="保证金模式"
                items={[
                  '逐仓：单笔最大损失封顶在本仓保证金，适合试错与方向不确定的单。',
                  '全仓：账户共享保证金，抗波动强，但一笔失控可拖垮整户——新手优先逐仓。',
                  '开仓前心算强平价：它应远在结构失效位之外，而不是「刚好在止损附近」。',
                ]}
              />
              <RuleCard
                title="资金费率"
                items={[
                  '费率是持仓成本，不是方向信号。极端正/负费率说明一侧拥挤，但拥挤可以持续很久。',
                  '计划持仓跨结算时，把预期费率算进盈亏比；费率吃掉的 R 不值得就别扛过夜。',
                  '费率 + 基差 + 多空比同向极端 → 更像「挤仓/setup」，不是追单理由。',
                ]}
              />
            </Box>
          </Section>

          <Section id="leverage" title="杠杆经验区间与品种选择">
            <SimpleTable
              headers={['杠杆档', '大致用途', '注意']}
              rows={[
                [
                  '2–5×',
                  '学习、试错、结构较宽的日线/4H 单',
                  '多数人应主要待在这里；杠杆低不等于没风险，仓位仍要按 R 算',
                ],
                [
                  '5–10×',
                  '失效位近、流动性好的主流币短线',
                  '止损必须机械执行；滑点与插针会快速吃掉缓冲',
                ],
                [
                  '10–20×',
                  '几乎只剩「赌一跳」',
                  '除非止损极近且仓位极小，否则期望值为负；日常禁用',
                ],
                [
                  '20×+',
                  '赌场档',
                  '一次噪音扫损即可伤到心态与账户；与「交易系统」无关',
                ],
              ]}
            />
            <SimpleTable
              headers={['品种档', '怎么选', '仓位建议']}
              rows={[
                [
                  '主流（BTC/ETH）',
                  '点差窄、深度好、行为相对可复现',
                  '可作为默认交易对象；相关仓合并计风险',
                ],
                [
                  '一线山寨',
                  '跟 BTC 相关但 beta 更大',
                  '仓位小于 BTC；突破假动作更多，确认门槛提高',
                ],
                [
                  '低流动性小币',
                  '易被扫、易插针、易被人控盘',
                  '默认不做；非做不可则逐仓 + 极小 R + 不扛过夜',
                ],
              ]}
            />
          </Section>

          <Section id="execution" title="执行、出场与加仓">
            <SimpleTable
              headers={['主题', '要点']}
              rows={[
                [
                  '止损单类型',
                  '剧烈波动用止损市价（保证出场）；流动性好时可止损限价，但要接受未成交风险。',
                ],
                [
                  '滑点预期',
                  '插针、强平潮、重大数据窗口，实际成交价可能比图表差一截；仓位要为此留余量。',
                ],
                [
                  '分批止盈',
                  '第一目标平 30%–50%，止损移至保本；余仓用结构或 trailing 跟趋势，别全仓等一个「完美顶」。',
                ],
                [
                  '加仓',
                  '只在盈利后、且新仓有独立失效位时金字塔加码；亏损单禁止摊平——摊平是换大风险赌方向。',
                ],
                [
                  '最低盈亏比',
                  '入场前粗算：若止损 1R，目标至少 1.5R–2R，否则胜率要极高才值得做。',
                ],
                [
                  '期望值',
                  '胜率 × 平均盈利 − 败率 × 平均亏损 > 0 才长期可活；只记盈亏不记 R 倍数，看不出系统在不在退化。',
                ],
              ]}
            />
          </Section>

          <Section id="events" title="时间与事件">
            <SimpleTable
              headers={['窗口', '注意什么']}
              rows={[
                [
                  '资金费结算前后',
                  '波动常放大，费率极端时小心被动平仓与假突破；无明确 edge 可避开结算前后 15–30 分钟。',
                ],
                [
                  '宏观数据（CPI/FOMC 等）',
                  '点差与滑点恶化，结构失效位容易被扫；事件前减仓或只做已有仓管理。',
                ],
                [
                  '周末 / 节假日',
                  '流动性变薄，假突破与插针增多；仓位减半或提高入场门槛。',
                ],
                [
                  '上新 / 维护 / 链上异常',
                  '交易所公告、充提暂停、合约下架——不确定时不开新仓。',
                ],
              ]}
            />
          </Section>

          <Section id="failures" title="常见翻车场景">
            <SimpleTable
              headers={['场景', '为什么亏', '拦截办法']}
              rows={[
                [
                  '止损拉到失效位外',
                  '「再给一点空间」= 单笔风险失控',
                  '先定 R，再定止损；止损动一次就要重算张数',
                ],
                [
                  '大赢后立刻加码',
                  '兴奋状态下放大仓位，一次回吐吃掉一周',
                  '大赢后下一笔恢复标准仓；当日不再提高单笔风险',
                ],
                [
                  '连亏后换品种追',
                  '报复式切换，没有 edge 只是换地方赌',
                  '连亏触发收工；换品种不算「休息」',
                ],
                [
                  '看对方向扛回止损',
                  '方向对但仓位/杠杆错，仍会被扫出局',
                  '方向与仓位是两件事；杠杆服务于失效位，不是服务于信心',
                ],
                [
                  '把浮盈当已实现',
                  '未平仓利润加大仓，回撤时心态崩',
                  '只有平仓才算赢；浮盈不加到「可用资金」里做下一笔',
                ],
                [
                  '强平潮里追方向',
                  '强平推动的 move 结束很快，接最后一棒',
                  '强平可短打，不把 cascade 当新趋势起点',
                ],
              ]}
            />
          </Section>

          <Section id="vigil" title="与 Vigil 面板联动（可选规则）">
            <Typography variant="body2" color="text.secondary">
              面板不是下单信号机，是「噪音过滤器」。把它写进纪律，比凭感觉点卡片更稳。
            </Typography>
            <SimpleTable
              headers={['规则', '怎么用']}
              rows={[
                [
                  '双家族亮圈才允许开新仓',
                  '价格家族 + 资金/持仓家族同时异常，才进入「可计划」名单；单条 3σ 只观察。',
                ],
                [
                  '亮圈 ≠ 立刻市价追',
                  '亮圈后仍要等结构位与失效位；用小周期找回踩/确认，而不是追最后一根。',
                ],
                [
                  'compression 单独出现',
                  '只记「盘整中」，不计入开仓理由；等打破盘整时的那次行情再评估。',
                ],
                [
                  '强平 / 极端费率',
                  '作过滤器或反向线索，不当趋势确认；极端费率下降低仓或缩短持仓。',
                ],
                [
                  '自选数量',
                  '自选太少，相对强弱（strength）失真；板子至少有一定广度再看超额。',
                ],
              ]}
            />
          </Section>

          <Divider />

          <Section id="rules" title="交易纪律">
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              }}
            >
              <RuleCard
                title="仓位与风险"
                items={[
                  '风险 = 止损距离 × 仓位 ÷ 权益；不是杠杆，也不是保证金用了多少。',
                  '合约常见单笔 1%–2%，硬顶约 3%。教材「永远 ≤1%」在加密合约上往往仓位小到没法做。',
                  '用结构位或 ATR 定止损再反推张数；当日亏约 4%–6% 或连亏 3 笔 → 收工。同向相关仓合并计风险。',
                ]}
              />
              <RuleCard
                title="入场与出场"
                items={[
                  '先写计划：市场状态（趋势/震荡）、触发、失效位、目标、仓位。',
                  '止损是入场的一部分；没有失效位 = 没有交易。',
                  '盈利后移动保护止损；勿因「指标还没死」无限推迟离场。',
                ]}
              />
              <RuleCard
                title="行为约束"
                items={[
                  '禁止：报复单、摊平亏损、无计划的「感觉要涨」。',
                  '禁止：重大数据/上币/维护窗口开满仓。',
                  '允许空仓。没结构、没交叉确认时，看盘 ≠ 必须交易。',
                ]}
              />
            </Box>
          </Section>

          <Section id="pre-trade" title="开仓前检查表">
            <SimpleTable
              headers={['检查项', '问自己']}
              rows={[
                ['市场状态', '现在是趋势还是震荡？用的策略是否匹配？'],
                ['大周期方向', '日线/4H 是否支持这笔方向？'],
                ['结构与失效位', '关键位在哪？破哪一价你认错？'],
                ['指标交叉', '趋势/动量/量能是否至少两类同向？'],
                ['仓位公式', '风险金额 ÷ 止损距离（可用 ATR）是否算过？'],
                ['强平价', '逐仓/全仓下，强平是否远在失效位之外？'],
                ['持仓时长', '若跨资金费结算，费率成本是否仍值得做？'],
                ['事件窗口', '接下来 1 小时有无数据/维护/极端波动？'],
                ['面板确认', '若用 Vigil：是否跨两个信号家族？还是单条噪音？'],
                ['情绪状态', '刚亏完、熬夜、大赢后兴奋、急于回本？是则跳过。'],
              ]}
            />
          </Section>

          <Section id="post-trade" title="平仓后复盘与日志模板">
            <SimpleTable
              headers={['维度', '记录什么']}
              rows={[
                ['计划执行度', '是否按计划进出？有无临时改规则？'],
                ['过程质量', '盈亏次要；违反纪律的盈利也记为坏交易。'],
                [
                  'R 倍数',
                  '这笔赚/亏了几 R？按 R 统计比按金额更能看系统是否在退化。',
                ],
                ['指标是否多余', '哪条确认真正有用？哪条只是重复噪音？'],
                ['可复用点', '触发条件能否写成固定配方？'],
                ['情绪笔记', '恐惧/贪婪出现在哪一步？下次如何拦截？'],
              ]}
            />
            <Paper
              variant="outlined"
              sx={{ p: 2, borderColor: 'surface.border' }}
            >
              <Typography sx={{ fontWeight: 600, mb: 1.25 }}>
                一笔交易最少记这些字段
              </Typography>
              <SimpleTable
                headers={['字段', '示例']}
                rows={[
                  ['品种 / 方向 / 周期', 'BTCUSDT · 多 · 15m 执行 / 4H 结构'],
                  ['市场状态', '趋势 / 震荡 / chop / 极端波动'],
                  ['触发与失效', '回踩 EMA20；收盘破前低下为止损'],
                  ['计划 R', '风险 1.5% 权益；目标 2R + 余仓 trailing'],
                  ['实际进出与滑点', '入场价、出场价、是否扫损'],
                  ['结果（R）', '+1.8R 或 −1R'],
                  ['纪律标签', '按计划 / 提前砍 / 挪止损 / 报复 / 摊平'],
                  ['截图', '入场前后各一张；复盘只看图不靠记忆'],
                ]}
              />
            </Paper>
          </Section>

          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderColor: 'surface.border' }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              一句话纪律
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'primary.main', mb: 1.5 }}
            >
              结构定方向，指标做交叉确认；只交易有失效位的计划单。
            </Typography>
            <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
              {[
                '无计划不下单',
                '无止损不开仓',
                '不堆同类指标',
                '不摊平',
                '不报复',
                '先认状态',
                '空仓也是仓位',
              ].map((label) => (
                <Chip
                  key={label}
                  size="small"
                  label={label}
                  sx={{ bgcolor: 'surface.subtle' }}
                />
              ))}
            </Stack>
          </Paper>

          <Typography variant="caption" color="text.disabled">
            通用交易规范整理，不构成投资建议。参数与周期需按品种波动自行校准。文本版见
            docs/trading-discipline.zh.md。
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}
