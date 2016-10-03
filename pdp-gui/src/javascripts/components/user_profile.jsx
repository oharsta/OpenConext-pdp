import React from "react";
import I18n from "i18n-js";

class UserProfile extends React.Component {

  render() {
    return (
        <ul className="user-profile">
          {this.renderRole()}
          {this.renderIdps()}
          {this.renderSps()}
        </ul>
    );
  }

  renderRole() {
    return (
        <li>
          <h2>{I18n.t("header.role")}</h2>
          <ul>
            <li className="user-profile-entity">
              {I18n.t("profile." + App.currentUser.authorities[0].authority)}
            </li>
          </ul>
        </li>
    );
  }

  renderIdps() {
    return (
        <li>
          <h2>{I18n.t("header.idps")}</h2>
          <ul>
            {App.currentUser.idpEntities.map(this.renderItem)}
          </ul>
        </li>
    );
  }

  renderSps() {
    if (!_.isEmpty(App.currentUser.spEntities)) {
      return (
          <li>
            <h2>{I18n.t("header.sps")}</h2>
            <ul>
              {App.currentUser.spEntities.map(this.renderItem)}
            </ul>
          </li>
      );
    }
  }

  renderItem(entity) {
    return (
        <li key={entity.entityId} className="user-profile-entity">
          <span>{I18n.entityName(entity)}</span>
        </li>
    );
  }


}

export default UserProfile;
