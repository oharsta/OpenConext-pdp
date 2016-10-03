App.Controllers.Policies = {

  initialize: function() {
    page("/policies",
        this.loadPolicies.bind(this),
        this.overview.bind(this)
    );

    page("/policy/:id",
        this.loadPolicy.bind(this),
        this.loadIdentityProvidersScoped.bind(this),
        this.loadServiceProviders.bind(this),
        this.loadAllowedAttributes.bind(this),
        this.detail.bind(this)
    );

    page("/new-policy",
        this.loadPolicy.bind(this),
        this.loadIdentityProvidersScoped.bind(this),
        this.loadServiceProviders.bind(this),
        this.loadAllowedAttributes.bind(this),
        this.detail.bind(this)
    );
  },

  loadPolicies: function(ctx, next) {
    $.get(App.apiUrl("/internal/policies"), data => {
      ctx.policies = data;
      next();
    });
  },

  loadServiceProviders: function(ctx, next) {
    $.get(App.apiUrl("/internal/serviceProviders"), data => {
      ctx.serviceProviders = data;
      next();
    });
  },

  loadIdentityProviders: function(ctx, next) {
    $.get(App.apiUrl("/internal/identityProviders"), data => {
      ctx.identityProviders = data;
      next();
    });
  },

  loadIdentityProvidersScoped: function(ctx, next) {
    $.get(App.apiUrl("/internal/identityProviders/scoped"), data => {
      ctx.identityProviders = data;
      next();
    });
  },

  loadAllowedAttributes: function(ctx, next) {
    $.get(App.apiUrl("/internal/attributes"), data => {
      ctx.allowedAttributes = data;
      next();
    });
  },

  loadPolicy: function(ctx, next) {
    const url = ctx.params.id ?
        App.apiUrl("/internal/policies/:id", { id: ctx.params.id }) : App.apiUrl("/internal/default-policy");
    $.get(url, data => {
      ctx.policy = data;
      next();
    });
  },

  overview: function(ctx) {
    App.render(App.Pages.PolicyOverview({ key: "policies", policies: ctx.policies, flash: App.getFlash() }));
  },

  detail: function(ctx) {
    App.render(App.Pages.PolicyDetail({
      key: "policy",
      policy: ctx.policy,
      identityProviders: ctx.identityProviders,
      serviceProviders: ctx.serviceProviders,
      allowedAttributes: ctx.allowedAttributes
    }
      ));
  },

  saveOrUpdatePolicy: function(policy, failureCallback) {
    const type = policy.id ? "PUT" : "POST";
    const json = JSON.stringify(policy);
    const action = policy.id ? I18n.t("policies.flash_updated") : I18n.t("policies.flash_created");
    const jqxhr = $.ajax({
      url: App.apiUrl("/internal/policies"),
      type: type,
      data: json
    }).done(() => {
      App.setFlash(I18n.t("policies.flash", { policyName: policy.name, action:action }));
      page("/policies");
    }).fail(() => {
      failureCallback(jqxhr);
    });
  },

  deletePolicy: function(policy) {
    $.ajax({
      url: App.apiUrl("/internal/policies/:id", { id: policy.id }),
      type: "DELETE"
    }).done(() => {
      App.setFlash(I18n.t("policies.flash", { policyName: policy.name, action: I18n.t("policies.flash_deleted") }));
      page("/policies");
    });
  }


};
