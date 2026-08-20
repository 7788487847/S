import Legal from "@/components/Legal";

export default function Page() {
  return (
    <Legal title="灵犀用户协议">
      <div className="space-y-6">
        <p className="font-medium">生效日期：2026年8月19日</p>
        <p>欢迎使用“灵犀”（www.rinsea.cn，以下简称“平台”）。平台是为画师与创作者提供作品展示的社区空间。请您仔细阅读本协议。</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">一、账号注册</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>您需使用有效邮箱完成注册并激活账号。</li>
            <li>昵称不得冒用公众人物姓名、不得含有“官方”“政务”“认证”等误导性词汇。平台保留重置违规昵称的权利。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">二、作品上传与原创承诺（重要）</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>您保证上传至平台的绘画、插画、设计等作品为<strong>原创作品</strong>或已获得合法授权。</li>
            <li>严禁上传侵犯迪士尼、宝可梦等第三方著作权、肖像权的内容。</li>
            <li>平台目前仅接受手画作品，不接受自动生成或主要由生成工具完成的内容。</li>
            <li>您授予平台一项<strong>非独占、免费、全球范围</strong>的许可，仅用于将您的作品在平台内进行展示、推广及技术适配（如压缩适配移动端）。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">三、平台责任与避风港原则</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>灵犀仅为用户提供信息存储空间，<strong>不对用户上传内容的版权合法性做实质审查</strong>。</li>
            <li>若权利人认为您的作品侵权，请通过平台《侵权投诉》通道提交通知。平台将在收到有效投诉后 <strong>24 小时内</strong>采取删除、屏蔽等必要措施，不承担赔偿责任。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">四、禁止行为</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>在简介、评论中留微信号、QQ号、手机号引导站外非法交易。</li>
            <li>盗用他人画风冒充知名画师。</li>
            <li>上传色情、暴力、政治敏感内容。</li>
          </ol>
          <p>违反上述规则，平台有权直接封禁账号并清空数据。</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">五、画师认证</h2>
          <p>画师认证仅用于展示“已认证创作者”标识，平台不收集您的身份证号，仅自愿留存姓名用于溯源。</p>
        </section>

        <hr className="border-stone-200" />
        <p>最终解释权归灵犀运营方所有。如有疑问，请联系：<a className="text-orange-600" href="mailto:admin@lingxi.art">admin@lingxi.art</a></p>
      </div>
    </Legal>
  );
}
