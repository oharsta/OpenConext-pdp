/** @jsx React.DOM */

App.Pages.PolicyConflicts = React.createClass({

  getInitialState: function () {
    return {data: []}
  },

  renderAboutPage: function () {
    return I18n.locale === "en" ? <App.Help.PolicyConflictsHelpEn/> : <App.Help.PolicyConflictsHelpNl/>;
  },

  renderOverview: function () {
    return ( <div>
      <p className="form-element title">{I18n.t("conflicts.title")}</p>
      {this.renderConflicts()}
    </div>);
  },

  createdDate: function (policy) {
    var created = moment(policy.created);
    created.locale(I18n.locale);
    return created.format('LLLL');
  },

  renderConflicts: function () {
    var serviceProviderNames = Object.keys(this.props.conflicts);
    if (_.isEmpty(serviceProviderNames)) {
      return (<div className={"form-element split sub-container"}>{I18n.t("conflicts.no_conflicts")}</div>)
    } else {
      return serviceProviderNames.map(function (sp, index) {
        return this.renderConflict(sp, index);
      }.bind(this));

    }
  },

  renderConflict: function (sp, index) {
    var policies = this.props.conflicts[sp];
    return (
      <div>
        <div className="form-element split sub-container" key={sp}>
          <h3>{I18n.t("conflicts.service_provider") + " : " + sp}</h3>
          <div>
            {this.renderPolicies(policies, index)}
          </div>
        </div>
        <div className="bottom"></div>
      </div>
    );
  },

  handleShowPolicyDetail: function (policy) {
    return function (e) {
      e.preventDefault();
      e.stopPropagation();
      page("/policy/:id", {id: policy.id});
    }
  },

  renderPolicies: function (policies, index) {
    return (
      <table className='table table-bordered dataTable' id={'conflicts_table_'+index}>
        <thead>
        <tr className='success'>
          <th className='conflict_policy_name'>{I18n.t("conflicts.table.name")}</th>
          <th className='conflict_idps'>{I18n.t("conflicts.table.idps")}</th>
          <th className='conflict_controls'></th>
        </tr>
        </thead>
        <tbody>
        { policies.map(function (policy) {
          return this.renderPolicyRow(policy);
        }.bind(this))}
        </tbody>
      </table>)
  },

  renderPolicyRow: function (policy) {
    return (
      <tr key={policy.id}>
        <td>{policy.name}</td>
        <td>{policy.identityProviderNames.join()}</td>
        <td className="conflict_controls">
          <a href={page.uri("/policy/:id", {id: policy.id})} onClick={this.handleShowPolicyDetail(policy)}
             data-tooltip={I18n.t("policies.edit")}> <i className="fa fa-edit"></i>
          </a>
        </td>
      </tr>)
  },

  render: function () {
    return (
      <div className="l-center mod-conflicts">
        <div className="l-split-left form-element-container box">
          {this.renderOverview()}
        </div>
        <div className="l-split-right form-element-container box">
          {this.renderAboutPage()}
        </div>
      </div>
    );
  }

});
