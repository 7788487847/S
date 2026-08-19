import Legal from "@/components/Legal";

export default function Page() {
  return (
    <Legal title="灵犀隐私政策">
      <div className="space-y-6">
        <p className="font-bold">我们非常重视您的个人信息保护。</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">一、我们收集什么？</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li><strong>账号信息</strong>：邮箱（用于登录与激活）、昵称、头像、简介。</li>
            <li><strong>可选信息</strong>：画师认证时自愿填写的真实姓名、社交平台主页链接。</li>
            <li><strong>技术信息</strong>：访问IP、浏览器类型（用于安全防护）。</li>
          </ol>
          <p className="rounded-2xl bg-orange-50 p-4 font-medium text-orange-800">⚠️ 本平台<strong>不收集手机号、不收集身份证号、不开通短信验证</strong>。</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">二、信息怎么存？</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>邮箱与自愿填写的姓名在数据库中采用 <strong>AES-256 加密存储</strong>。</li>
            <li>图片文件存储于阿里云对象存储（OSS），服务器本身不长期留存原图。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">三、您的权利</h2>
          <ol className="list-decimal space-y-2 pl-6">
            <li>随时登录修改个人资料。</li>
            <li>注销账号：可向站长申请注销，账号注销后 30 天内我们将匿名化删除您的个人数据。</li>
            <li>拒绝营销：我们目前不发营销邮件，仅发送必要的激活/安全通知。</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">四、Cookie</h2>
          <p>仅用于维持登录状态（JWT Token），不用于追踪广告。</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">五、儿童隐私</h2>
          <p>未满 14 周岁请勿注册。如发现问题将立即删除。</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">六、联系我们</h2>
          <p>隐私问题请联系：<a className="text-orange-600" href="mailto:admin@lingxi.art">admin@lingxi.art</a></p>
        </section>

        <hr className="border-stone-200" />
        <p>备案号：<span id="beian">[待填写ICP号]</span></p>
      </div>
    </Legal>
  );
}
