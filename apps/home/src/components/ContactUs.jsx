export function ContactUs() {
  return (
    <section id="contact-us">
      <div className="bg-black py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-16 divide-y divide-gray-100 lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  Join our community
                </h2>
                <p className="mt-4 leading-7 text-slate-300">
                  Support us by starring our GitHub! We would love any feedback
                  or requests via Discord or email. Check out our docs if you
                  want help with authentication for our public APIs.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-2 lg:gap-8">
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Email
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dt className="sr-only">Email</dt>
                      <dd>
                        <a
                          className="font-semibold text-indigo-600"
                          href="mailto:collaborate@example.com"
                        >
                          team@recipeui.com
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Discord
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dd>
                        <a
                          className="font-semibold text-indigo-600"
                          href="https://discord.gg/rXmpYmCNNA"
                        >
                          Join our Discord
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    GitHub
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dd>
                        <a
                          className="font-semibold text-indigo-600"
                          href="https://github.com/RecipeUI/RecipeUI"
                        >
                          Star our GitHub
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-gray-50 p-10">
                  <h3 className="text-base font-semibold leading-7 text-gray-900">
                    Docs
                  </h3>
                  <dl className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                    <div>
                      <dd>
                        <a
                          className="font-semibold text-indigo-600"
                          href="https://docs.recipeui.com/"
                        >
                          Authentication guide for our APIs
                        </a>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
