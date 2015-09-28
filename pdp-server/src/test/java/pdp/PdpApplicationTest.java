package pdp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.openaz.xacml.api.Decision;
import org.apache.openaz.xacml.api.Response;
import org.apache.openaz.xacml.api.Result;
import org.apache.openaz.xacml.std.json.JSONResponse;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.boot.test.TestRestTemplate;
import org.springframework.boot.test.WebIntegrationTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import pdp.domain.*;
import pdp.repositories.PdpPolicyViolationRepository;
import pdp.xacml.DevelopmentPrePolicyLoader;
import pdp.xacml.PdpPolicyDefinitionParser;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collector;
import java.util.stream.Collectors;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import static pdp.teams.VootClientConfig.URN_COLLAB_PERSON_EXAMPLE_COM_ADMIN;
import static pdp.xacml.PdpPolicyDefinitionParser.*;

/**
 * Not this class is slow. it starts up the entire Spring boot app.
 * <p/>
 * If you want to test policies quickly then see StandAlonePdpEngineTest
 */
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = PdpApplication.class)
@WebIntegrationTest(randomPort = true, value = {"xacml.properties.path=classpath:xacml.conext.properties", "spring.profiles.active=dev"})
public class PdpApplicationTest {

  @Autowired
  private PdpPolicyViolationRepository pdpPolicyViolationRepository;

  @Value("${local.server.port}")
  private int port;
  private MultiValueMap<String, String> headers;
  private TestRestTemplate restTemplate = new TestRestTemplate("pdp-admin", "secret");
  private ObjectMapper objectMapper = new ObjectMapper();
  private PdpPolicyDefinitionParser policyDefinitionParser = new PdpPolicyDefinitionParser();
  private DevelopmentPrePolicyLoader developmentPrePolicyLoader = new DevelopmentPrePolicyLoader();

  @Before
  public void before() throws IOException {
    headers = new LinkedMultiValueMap<>();
    headers.add("Content-Type", "application/json");
  }

  @Test
  public void test_all_policies() throws Exception {
    JsonPolicyRequest policyRequest = objectMapper.readValue(new ClassPathResource("xacml/requests/base_request.json").getInputStream(), JsonPolicyRequest.class);
    List<PdpPolicy> policies = developmentPrePolicyLoader.getPolicies();

    policies.forEach(policy -> doTestPolicy(policyRequest, policy));
  }

  private void doTestPolicy(JsonPolicyRequest policyRequest, PdpPolicy policy) {
    PdpPolicyDefinition definition = policyDefinitionParser.parse(policy.getName(), policy.getPolicyXml());
    JsonPolicyRequest permitPolicyRequest = policyRequest.copy();
    permitPolicyRequest.addOrReplaceResourceAttribute(SP_ENTITY_ID, definition.getServiceProviderId());
    if (definition.getIdentityProviderIds().isEmpty()) {
      permitPolicyRequest.deleteAttribute(IDP_ENTITY_ID);
    } else {
      permitPolicyRequest.addOrReplaceResourceAttribute(IDP_ENTITY_ID, definition.getIdentityProviderIds().get(0));
    }
    JsonPolicyRequest denyPolicyRequest = permitPolicyRequest.copy();
    Map<String, List<PdpAttribute>> groupedAttributes = definition.getAttributes().stream().collect(Collectors.groupingBy(PdpAttribute::getName));
    Set<Map.Entry<String, List<PdpAttribute>>> entries = groupedAttributes.entrySet();
    entries.forEach(entry -> {
      permitPolicyRequest.addOrReplaceAccessSubjectAttribute(entry.getKey(), entry.getValue().get(0).getValue());
      denyPolicyRequest.deleteAttribute(entry.getKey());
    });
    if (definition.getAttributes().stream().filter(pdpAttribute -> pdpAttribute.getName().equalsIgnoreCase(GROUP_URN)).findFirst().isPresent()) {
      permitPolicyRequest.addOrReplaceAccessSubjectAttribute(NAME_ID, URN_COLLAB_PERSON_EXAMPLE_COM_ADMIN);
    }
    try {
      //We can't use Transactional rollback as the Application runs in a different process.
      pdpPolicyViolationRepository.deleteAll();

      postDecide(permitPolicyRequest, definition.isDenyRule() ? Decision.DENY : Decision.PERMIT, "urn:oasis:names:tc:xacml:1.0:status:ok");
      postDecide(denyPolicyRequest, definition.isDenyRule() ? Decision.PERMIT : Decision.DENY, "urn:oasis:names:tc:xacml:1.0:status:ok");
      assertViolations(definition.getDenyId());
    } catch (Exception e) {
      throw new RuntimeException(e);
    }
  }

  private void postDecide(JsonPolicyRequest policyRequest, Decision expectedDecision, String statusCodeValue) throws Exception {
    final String url = "http://localhost:" + port + "/pdp/api/decide/policy";
    String jsonRequest = objectMapper.writeValueAsString(policyRequest);
    HttpEntity<String> request = new HttpEntity<>(jsonRequest, headers);
    String jsonResponse = restTemplate.postForObject(url, request, String.class);
    Response response = JSONResponse.load(jsonResponse);
    assertEquals(1, response.getResults().size());
    Result result = response.getResults().iterator().next();
    assertEquals(expectedDecision, result.getDecision());
    assertEquals(statusCodeValue, result.getStatus().getStatusCode().getStatusCodeValue().getUri().toString());
  }

  private void assertViolations(String associatedAdviceId) throws Exception {
    //test the repo
    Optional<PdpPolicyViolation> violation = pdpPolicyViolationRepository.findByAssociatedAdviceId(associatedAdviceId).stream().collect(singletonOptionalCollector());
    assertTrue(violation.isPresent());
    //test the repo for countBy
    Long count = pdpPolicyViolationRepository.countByAssociatedAdviceId(associatedAdviceId);
    assertEquals(1L, count.longValue());
  }


  private <T> Collector<T, List<T>, Optional<T>> singletonOptionalCollector() {
    return Collector.of(ArrayList::new, List::add, (left, right) -> {
          left.addAll(right);
          return left;
        }, list -> {
          if (list.isEmpty()) {
            return Optional.empty();
          }
          return Optional.of(list.get(0));
        }
    );
  }

}
